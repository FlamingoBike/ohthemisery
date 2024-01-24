import SelectInput from '../items/selectInput';
import CheckboxWithLabel from '../items/checkboxWithLabel';
import ItemTile from '../items/itemTile';
import MasterworkableItemTile from '../items/masterworkableItemTile';
import styles from '../../styles/Items.module.css'
import React from 'react';
import { useRouter } from 'next/router';

import Stats from '../../utils/builder/stats';
import TranslatableText from '../translatableText';
import ListSelector from './listSelector';
import CharmSelector from './charmSelector';
import CharmShortener from '../../utils/builder/charmShortener';

const emptyBuild = { mainhand: "None", offhand: "None", helmet: "None", chestplate: "None", leggings: "None", boots: "None" };

const enabledBoxes = {
    // Situationals
    shielding: false,
    poise: false,
    inure: false,
    steadfast: false,
    guard: false,
    ethereal: false,
    reflexes: false,
    evasion: false,
    tempo: false,
    cloaked: false,
    secondwind: false,
    // Other Buffs
    versatile: false,
    divinejustice: false
};

const extraStats = {
    damageMultipliers: [],
    resistanceMultipliers: [],
    healthMultipliers: [],
    speedMultipliers: []
}

function groupMasterwork(items, itemData) {
    // Group up masterwork tiers by their name using an object, removing them from items.
    let masterworkItems = {};
    // Go through the array in reverse order to have the splice work properly
    // (items will go down in position if not removed from the end)
    for (let i = items.length - 1; i >= 0; i--) {
        let name = items[i];
        if (itemData[name].masterwork != undefined) {
            let itemName = itemData[name].name;
            if (!masterworkItems[itemName]) {
                masterworkItems[itemName] = [];
            }
            masterworkItems[itemName].push(itemData[name]);
            items.splice(i, 1);
        }
    }

    // Re-insert the groups as arrays into the items array.
    Object.keys(masterworkItems).forEach(item => {
        items.push({ value: `${item}-${masterworkItems[item][0].masterwork}`, label: item });
    });

    return items;
}

function getRelevantItems(types, itemData) {
    let items = Object.keys(itemData);
    return groupMasterwork(items.filter(name => types.includes(itemData[name].type.toLowerCase().replace(/<.*>/, "").trim())), itemData);
}

function recalcBuild(data, itemData) {
    let tempStats = new Stats(itemData, data, enabledBoxes, extraStats);
    return tempStats;
}

function createMasterworkData(name, itemData) {
    return Object.keys(itemData).filter(itemName => itemData[itemName].name == name).map(itemName => itemData[itemName]);
}

function removeMasterworkFromName(name) {
    return name.replace(/-\d$/g, "");
}

function checkExists(type, itemsToDisplay, itemData) {
    let retVal = false;
    if (itemsToDisplay.itemStats) {
        retVal = itemsToDisplay.itemStats[type] !== undefined;
    }
    if (itemsToDisplay.itemNames && itemsToDisplay.itemNames[type] && createMasterworkData(removeMasterworkFromName(itemsToDisplay.itemNames[type]), itemData)[0]?.masterwork != undefined) {
        retVal = true;
    }
    return retVal;
}

export default function BuildForm({ update, build, parentLoaded, itemData }) {
    const [stats, setStats] = React.useState({});
    const [charms, setCharms] = React.useState([]);
    const [urlCharms, setUrlCharms] = React.useState([]);

    const [updateLoaded, setUpdateLoaded] = React.useState(false);

    function sendUpdate(event) {
        event.preventDefault();
        const itemNames = Object.fromEntries(new FormData(event.target).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
        router.push(`/builder?${makeBuildString()}`, `/builder/${makeBuildString()}`, { shallow: true });
    }

    React.useEffect(() => {
        if (parentLoaded && build) {
            let buildParts = decodeURI(build).split("&");
            let itemNames = {
                mainhand: (buildParts.find(str => str.includes("m="))?.split("m=")[1]),
                offhand: (buildParts.find(str => str.includes("o="))?.split("o=")[1]),
                helmet: (buildParts.find(str => str.includes("h="))?.split("h=")[1]),
                chestplate: (buildParts.find(str => str.includes("c="))?.split("c=")[1]),
                leggings: (buildParts.find(str => str.includes("l="))?.split("l=")[1]),
                boots: (buildParts.find(str => str.includes("b="))?.split("b=")[1])
            };
            Object.keys(itemNames).forEach(type => {
                if (itemNames[type] === undefined || !Object.keys(itemData).includes(itemNames[type])) {
                    itemNames[type] = "None";
                }
            });
            let charmString = buildParts.find(str => str.includes("charm="));
            if (charmString) {
                let charmList = CharmShortener.parseCharmData(charmString.split("charm=")[1], itemData);
                setUrlCharms(charmList);
                setCharms(charmList);
            }
            const tempStats = recalcBuild(itemNames, itemData);
            setStats(tempStats);
            update(tempStats);
            setUpdateLoaded(true);
        }
    }, [parentLoaded]);

    const itemTypes = ["mainhand", "offhand", "helmet", "chestplate", "leggings", "boots"];

    const formRef = React.useRef();
    const router = useRouter();
    const itemRefs = {
        mainhand: React.useRef(),
        offhand: React.useRef(),
        helmet: React.useRef(),
        chestplate: React.useRef(),
        leggings: React.useRef(),
        boots: React.useRef()
    }

    function resetForm(event) {
        for (let ref in itemRefs) {
            itemRefs[ref].current.setValue({ value: "None", label: "None" });
        }
        const tempStats = recalcBuild(emptyBuild, itemData)
        setStats(tempStats);
        update(tempStats);
        router.push('/builder', `/builder/`, { shallow: true });
    }

    function receiveMasterworkUpdate(newActiveItem, itemType) {
        let newBuild = {};
        for (let ref in itemRefs) {
            newBuild[ref] = itemRefs[ref].current.getValue()[0].value;
        }
        let mainhands = ["mainhand", "mainhand sword", "mainhand shield", "axe", "pickaxe", "wand", "scythe", "bow", "crossbow", "snowball", "trident"];
        let offhands = ["offhand", "offhand shield", "offhand sword"];
        let actualItemType = (mainhands.includes(itemType.toLowerCase())) ? "mainhand" : (offhands.includes(itemType.toLowerCase())) ? "offhand" : itemType.toLowerCase();

        const manualBuildString = encodeURI(decodeURI(makeBuildString()).replace(newBuild[actualItemType.toLowerCase()], `${newActiveItem.name}-${newActiveItem.masterwork}`));
        newBuild[actualItemType.toLowerCase()] = `${newActiveItem.name}-${newActiveItem.masterwork}`;
        itemRefs[actualItemType.toLowerCase()].current.setValue({ "value": `${newActiveItem.name}-${newActiveItem.masterwork}`, "label": newActiveItem.name });
        router.push(`/builder?${manualBuildString}`, `/builder/${manualBuildString}`, { shallow: true });

        const tempStats = recalcBuild(newBuild, itemData)
        setStats(tempStats);
        update(tempStats);
    }

    function copyBuild(event) {
        let baseUrl = `${window.location.origin}/builder/`;
        event.target.value = "Copied!";
        event.target.classList.add("fw-bold");
        setTimeout(() => { event.target.value = "Share"; event.target.classList.remove("fw-bold") }, 3000);

        if (!navigator.clipboard) {
            window.alert("Couldn't copy build to clipboard. Sadness. :(");
            return;
        }
        navigator.clipboard.writeText(`${baseUrl}${makeBuildString()}`).then(function () {
            console.log('Copying to clipboard was successful!');
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    }

    function getEquipName(type) {
        if (!build) return undefined
        let buildParts = decodeURI(build).split("&");
        let allowedTypes = ["mainhand", "offhand", "helmet", "chestplate", "leggings", "boots"]
        let name = (allowedTypes.includes(type)) ? buildParts.find(str => str.includes(`${type[0]}=`))?.split(`${type[0]}=`)[1] : "None";
        if (!Object.keys(itemData).includes(name)) {
            return { "value": "None", "label": "None" };
        }
        return { "value": name, "label": removeMasterworkFromName(name) };
    }

    function makeBuildString(charmsOverride) {
        let data = new FormData(formRef.current).entries();
        let buildString = "";
        let keysToShare = ["mainhand", "offhand", "helmet", "chestplate", "leggings", "boots"];
        for (const [key, value] of data) {
            buildString += (keysToShare.includes(key)) ? `${key[0]}=${value.replaceAll(" ", "%20")}&` : "";
        }

        let charmsToLookAt = (charmsOverride) ? charmsOverride : charms;

        if (charmsToLookAt.length == 0) {
            return (buildString + "charm=None");
        }

        return (buildString += `charm=${CharmShortener.shortenCharmList(charmsToLookAt)}`);
    }

    function checkboxChanged(event) {
        const name = event.target.name;
        enabledBoxes[name] = event.target.checked;
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function multipliersChanged(newMultipliers, name) {
        extraStats[name] = newMultipliers;
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function damageMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "damageMultipliers");
    }

    function resistanceMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "resistanceMultipliers");
    }

    function healthMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "healthMultipliers");
    }

    function speedMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, "speedMultipliers");
    }

    function updateCharms(charmNames) {
        let charmData = charmNames.map(name => itemData[name]);
        setCharms(charmData);
        router.push(`/builder?${makeBuildString(charmData)}`, `/builder/${makeBuildString(charmData)}`, { shallow: true });
    }

    return (
        <form ref={formRef} onSubmit={sendUpdate} onReset={resetForm}>
            <div className="row justify-content-center mb-3">
                <div className="col-12 col-md-5 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.mainhand"></TranslatableText>
                    <SelectInput reference={itemRefs.mainhand} name="mainhand" default={getEquipName("mainhand")} noneOption={true} sortableStats={getRelevantItems(["mainhand", "mainhand sword", "mainhand shield", "axe", "pickaxe", "wand", "scythe", "bow", "crossbow", "snowball", "trident"], itemData)}></SelectInput>
                </div>
                <div className="col-12 col-md-5 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.offhand"></TranslatableText>
                    <SelectInput reference={itemRefs.offhand} name="offhand" default={getEquipName("offhand")} noneOption={true} sortableStats={getRelevantItems(["offhand", "offhand shield", "offhand sword"], itemData)}></SelectInput>
                </div>
            </div>
            <div className="row justify-content-center mb-2 pt-2">
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.helmet"></TranslatableText>
                    <SelectInput reference={itemRefs.helmet} noneOption={true} name="helmet" default={getEquipName("helmet")} sortableStats={getRelevantItems(["helmet"], itemData)}></SelectInput>
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.chestplate"></TranslatableText>
                    <SelectInput reference={itemRefs.chestplate} noneOption={true} name="chestplate" default={getEquipName("chestplate")} sortableStats={getRelevantItems(["chestplate"], itemData)}></SelectInput>
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.leggings"></TranslatableText>
                    <SelectInput reference={itemRefs.leggings} noneOption={true} name="leggings" default={getEquipName("leggings")} sortableStats={getRelevantItems(["leggings"], itemData)}></SelectInput>
                </div>
                <div className="col-12 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.boots"></TranslatableText>
                    <SelectInput reference={itemRefs.boots} noneOption={true} name="boots" default={getEquipName("boots")} sortableStats={getRelevantItems(["boots"], itemData)}></SelectInput>
                </div>
            </div>
            <div className="row justify-content-center pt-2">
                <TranslatableText identifier="builder.misc.situationals" className="text-center mb-1"></TranslatableText>
                <CheckboxWithLabel name="Shielding" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Poise" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Inure" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Steadfast" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Guard" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="SecondWind" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Ethereal" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Reflexes" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Evasion" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Tempo" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Cloaked" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="Versatile" checked={false} onChange={checkboxChanged} />
                <CheckboxWithLabel name="DivineJustice" checked={false} onChange={checkboxChanged} />
            </div>
            <div className="row justify-content-center my-2">
                <div className="col text-center">
                    <p className="mb-1"><TranslatableText identifier="builder.misc.situationalCap"></TranslatableText></p>
                    <input type="number" name="situationalCap" placeholder="Situational Cap" min="1" defaultValue="30" className=""></input>
                </div>
            </div>
            <div className="row justify-content-center my-2">
                <div className="col text-center">
                    <p className="mb-1"><TranslatableText identifier="builder.misc.maxHealthPercent"></TranslatableText></p>
                    <input type="number" name="health" min="1" defaultValue="100" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Tenacity</p>
                    <input type="number" name="tenacity" min="0" max="24" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Vitality</p>
                    <input type="number" name="vitality" min="0" max="24" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Vigor</p>
                    <input type="number" name="vigor" min="0" max="24" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Focus</p>
                    <input type="number" name="focus" min="0" max="24" defaultValue="0" className="" />
                </div>
                <div className="col text-center">
                    <p className="mb-1">Perspicacity</p>
                    <input type="number" name="perspicacity" min="0" max="24" defaultValue="0" className="" />
                </div>
            </div>
            <div className="row pt-2">
                <span className="text-center text-danger fs-2 fw-bold">{(stats.corruption > 1) ? <TranslatableText identifier="builder.errors.corruption"></TranslatableText> : ""}</span>
            </div>
            <div className="row py-2">
                <span className="text-center text-danger fs-2 fw-bold">{(stats.twoHanded && !stats.weightless && stats.itemNames.offhand != "None") ? <TranslatableText identifier="builder.errors.twoHanded"></TranslatableText> : ""}</span>
            </div>
            <div className="row mb-2 justify-content-center">
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={damageMultipliersChanged} translatableName="builder.multipliers.damage"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={resistanceMultipliersChanged} translatableName="builder.multipliers.resistance"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={healthMultipliersChanged} translatableName="builder.multipliers.health"></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector update={speedMultipliersChanged} translatableName="builder.multipliers.speed"></ListSelector>
                </div>
            </div>
            <div className="row my-3">
                <div className="col-12">
                    <CharmSelector update={updateCharms} translatableName={"builder.charms.select"} urlCharms={urlCharms} updateLoaded={updateLoaded} itemData={itemData}></CharmSelector>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button type="submit" className={styles.recalcButton} value="Recalculate">
                        <TranslatableText identifier="builder.buttons.recalculate"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button type="button" className={styles.shareButton} id="share" onClick={copyBuild}>
                        <TranslatableText identifier="builder.buttons.share"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <input type="reset" className={styles.resetButton} />
                </div>
            </div>
            <div className="row justify-content-center mb-2">
                {
                    itemTypes.map(type =>
                        (checkExists(type, stats, itemData)) ?
                            (stats.fullItemData[type].masterwork != undefined) ?
                                <MasterworkableItemTile update={receiveMasterworkUpdate} key={stats.itemNames[type]} name={removeMasterworkFromName(stats.itemNames[type])} item={createMasterworkData(removeMasterworkFromName(stats.itemNames[type]), itemData)} default={Number(stats.itemNames[type].split("-")[1])}></MasterworkableItemTile> :
                                <ItemTile key={type} name={stats.itemNames[type]} item={stats.fullItemData[type]}></ItemTile> : ""
                    )
                }
            </div>
        </form>
    )
}
