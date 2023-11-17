import SelectInput from './selectInput'
import CheckboxWithLabel from './checkboxWithLabel'
import styles from '../../styles/Items.module.css'
import React from 'react'
import TranslatableText from '../translatableText'
import extras from '../../public/items/extras.json';

const charmClasses = ["Any Class", "Alchemist", "Mage", "Warlock", "Rogue", "Warrior", "Cleric", "Scout", "Shaman", "Generalist"]

let sortableStats = ["-"];
let regions = ["Any Region"];
let tiers = ["Any Tier"];
let locations = ["Any Location"];
let pois = ["Any POI"];
let charmStats = ["Any Stat"];
let baseItems = ["Any Item"];

const checkboxLongTouch = {
    timer: 0,
    duration: 500
}

function getResetKey(name) {
    return name + new Date()
}

function generateSortableItemStats(itemData) {
    sortableStats = ["-"];
    let itemNames = Object.keys(itemData).filter(item => itemData[item].type != "Charm");
    let uniqueItemStats = {};
    for (let itemName of itemNames) {
        if (itemData[itemName].stats) {
            Object.keys(itemData[itemName].stats).forEach(stat => {
                uniqueItemStats[stat] = 1;
            });
        }
    }
    Object.keys(uniqueItemStats).forEach(stat => {
        sortableStats.push(stat.split("_").map(part => part[0].toUpperCase() + part.substring(1)).join(" "));
    });
}

function generateRegions(itemData) {
    regions = ["Any Region"];
    let uniqueRegions = {};
    Object.keys(itemData).map(item => itemData[item].region).filter(regionName => regionName != undefined).forEach(regionName => {
        uniqueRegions[regionName] = 1;
    });
    Object.keys(uniqueRegions).forEach(regionName => regions.push(regionName));
}

function generateTiers(itemData) {
    tiers = ["Any Tier"];
    let uniqueTiers = {};
    Object.keys(itemData).map(item => itemData[item].tier).filter(tierName => tierName != undefined).forEach(tierName => {
        uniqueTiers[tierName] = 1;
    });
    // Remove the Charm tier since there is a checkbox for it.
    delete uniqueTiers.Charm;
    Object.keys(uniqueTiers).forEach(tierName => tiers.push(tierName));
}

function generateSortableCharmStats(itemData) {
    charmStats = ["Any Stat"];
    let charmNames = Object.keys(itemData).filter(item => itemData[item].type == "Charm");
    let uniqueCharmAttributes = {};
    for (let charmName of charmNames) {
        Object.keys(itemData[charmName].stats).forEach(attribute => {
            uniqueCharmAttributes[attribute] = 1;
        });
    }
    Object.keys(uniqueCharmAttributes).forEach(attribute => {
        charmStats.push(attribute.split("_").map(part => part[0].toUpperCase() + part.substring(1)).join(" ").replace(" Flat", "").replace(" Percent", " %"));
    });
}

function generateLocations(itemData) {
    locations = ["Any Location"];
    let uniqueLocations = {};
    Object.keys(itemData).map(item => itemData[item].location).filter(locationName => locationName != undefined).forEach(locationName => {
        uniqueLocations[locationName] = 1;
    });
    Object.keys(uniqueLocations).forEach(locationName => locations.push(locationName));
}

function generatePOIs() {
    pois = ["Any POI"];
    let uniquePois = {};
    Object.keys(extras).filter(extra => extras[extra].poi != undefined).map(extra => extras[extra].poi).forEach(poiName => {
        uniquePois[poiName] = 1;
    });
    Object.keys(uniquePois).forEach(poiName => pois.push(poiName));
}

function generateBaseItems(itemData) {
    baseItems = ["Any Item"];
    let uniqueBaseItems = {};
    Object.keys(itemData).map(item => itemData[item].base_item).filter(baseItemName => baseItemName != undefined).forEach(baseItemName => {
        uniqueBaseItems[baseItemName] = 1;
    });
    Object.keys(uniqueBaseItems).forEach(baseItemName => baseItems.push(baseItemName));
}

export default function LegacySearchForm({ update, itemData }) {
    const [searchKey, setSearchKey] = React.useState(getResetKey("search"))
    const [regionKey, setRegionKey] = React.useState(getResetKey("region"))
    const [tierKey, setTierKey] = React.useState(getResetKey("tier"))
    const [locationKey, setLocationKey] = React.useState(getResetKey("location"))
    const [poiKey, setPoiKey] = React.useState(getResetKey("poi"))
    const [classKey, setClassKey] = React.useState(getResetKey("class"))
    const [charmStatKey, setCharmStatKey] = React.useState(getResetKey("charmStat"))
    const [baseItemKey, setBaseItemKey] = React.useState(getResetKey("baseItem"))
    const form = React.useRef()

    generateSortableItemStats(itemData);
    generateRegions(itemData);
    generateTiers(itemData);
    generateSortableCharmStats(itemData);
    generateLocations(itemData);
    generatePOIs();
    generateBaseItems(itemData);

    function sendUpdate(event = {}) {
        if (event.type === "submit") {
            event.preventDefault()
        }
        update(Object.fromEntries(new FormData(form.current).entries()));
    }

    function disableRightClick(event) {
        event.preventDefault()
    }

    function resetForm() {
        // Giving a new key to an element recreates it from scratch. It is used as a workaround to reset a component that doesn't reset on its own
        setSearchKey(getResetKey("search"))
        setRegionKey(getResetKey("region"))
        setTierKey(getResetKey("tier"))
        setLocationKey(getResetKey("location"))
        setPoiKey(getResetKey("poi"))
        setClassKey(getResetKey("class"))
        setCharmStatKey(getResetKey("charmStat"))
        setBaseItemKey(getResetKey("baseItem"))
    }

    function uncheckOthers(event) {
        // Selects the checkbox given that you clicked the label or checkbox
        let interestingElement = event.target.parentElement.firstChild;
        if (interestingElement.type != "checkbox") {
            interestingElement = event.target.firstChild;
        }
        if (interestingElement && interestingElement.type == "checkbox") {
            if (event.button == 2) {
                event.preventDefault()
                interestingElement.checked = true;
                for (const group of interestingElement.parentElement.parentElement.parentElement.children) {
                    for (const checkboxHolder of group.children) {
                        if (checkboxHolder.firstChild.id != interestingElement.id) {
                            checkboxHolder.firstChild.checked = false;
                        }
                    }
                }
            } else if (event.button == 0 && event.target.localName == "div") {
                // Makes it so that you check/uncheck the checkbox even if you click the div that the checkbox is in and not directly on the checkbox
                interestingElement.checked = !interestingElement.checked;
            }
        }
    }

    function uncheckOthersLongTouch(event) {
        // Selects the checkbox given that you clicked the label or checkbox
        let interestingElement = event.target.parentElement.firstChild;
        if (interestingElement.type != "checkbox") {
            interestingElement = event.target.firstChild;
        }

        if (interestingElement && (interestingElement.type == "checkbox" || event.target.localName == "div")) {
            checkboxLongTouch.timer = setTimeout(() => {
                interestingElement.checked = true;
                for (const group of interestingElement.parentElement.parentElement.parentElement.children) {
                    for (const checkboxHolder of group.children) {
                        if (checkboxHolder.firstChild.id != interestingElement.id) {
                            checkboxHolder.firstChild.checked = false;
                        }
                    }
                }
            }, checkboxLongTouch.duration);
        } else if (event.target.localName == "div") {
            interestingElement.checked = !interestingElement.checked;
        }
    }

    function clearLongTouch() {
        if (checkboxLongTouch.timer) {
            clearTimeout(checkboxLongTouch.timer);
        }
    }

    return (
        <form onSubmit={sendUpdate} onReset={resetForm} onContextMenu={disableRightClick} onMouseDown={uncheckOthers} onTouchStart={uncheckOthersLongTouch} onTouchEnd={clearLongTouch} ref={form} className={styles.searchForm}>
            <div className={styles.inputs}>
                <div className={styles.checkboxes} title="Right-click a checkbox to deselect all others">
                    <TranslatableText identifier="items.searchForm.displayItems"></TranslatableText>
                    <div className={styles.checkboxSubgroup}>
                        <CheckboxWithLabel name="Helmet" translatableName="items.type.helmet" checked={true} />
                        <CheckboxWithLabel name="Chestplate" translatableName="items.type.chestplate" checked={true} />
                        <CheckboxWithLabel name="Leggings" translatableName="items.type.leggings" checked={true} />
                        <CheckboxWithLabel name="Boots" translatableName="items.type.boots" checked={true} />
                    </div>
                    <div className={styles.checkboxSubgroup}>
                        <CheckboxWithLabel name="Axe" translatableName="items.type.axe" checked={true} />
                        <CheckboxWithLabel name="Wand" translatableName="items.type.wand" checked={true} />
                        <CheckboxWithLabel name="Scythe" translatableName="items.type.scythe" checked={true} />
                        <CheckboxWithLabel name="Pickaxe" translatableName="items.type.pickaxe" checked={true} />
                        <CheckboxWithLabel name="Shovel" translatableName="items.type.shovel" checked={true} />
                    </div>
                    <div className={styles.checkboxSubgroup}>
                        <CheckboxWithLabel name="Bow" translatableName="items.type.bow" checked={true} />
                        <CheckboxWithLabel name="Crossbow" translatableName="items.type.crossbow" checked={true} />
                        <CheckboxWithLabel name="Snowball" translatableName="items.type.snowball" checked={true} />
                        <CheckboxWithLabel name="Trident" translatableName="items.type.trident" checked={true} />
                        <CheckboxWithLabel name="Projectile" translatableName="items.type.projectile" checked={true} />
                    </div>
                    <div className={styles.checkboxSubgroup}>
                        <CheckboxWithLabel name="Offhand Shield" translatableName="items.type.offhandShield" checked={true} />
                        <CheckboxWithLabel name="Mainhand Shield" translatableName="items.type.mainhandShield" checked={true} />
                        <CheckboxWithLabel name="Mainhand Sword" translatableName="items.type.mainhandSword" checked={true} />
                        <CheckboxWithLabel name="Offhand Sword" translatableName="items.type.offhandSword" checked={true} />
                    </div>
                    <div className={styles.checkboxSubgroup}>
                        <CheckboxWithLabel name="Mainhand" translatableName="items.type.mainhand" checked={true} />
                        <CheckboxWithLabel name="Offhand" translatableName="items.type.offhand" checked={true} />
                        <CheckboxWithLabel name="Consumable" translatableName="items.type.consumable" checked={true} />
                        <CheckboxWithLabel name="Misc" translatableName="items.type.misc" checked={true} />
                        <CheckboxWithLabel name="Charm" translatableName="items.type.charm" checked={true} />
                    </div>
                    <TranslatableText identifier="items.searchForm.tip"></TranslatableText>
                </div>
                <div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.sortBy"></TranslatableText>
                        <SelectInput key={searchKey} name="sortSelect" sortableStats={sortableStats} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.region"></TranslatableText>
                        <SelectInput key={regionKey} name="regionSelect" sortableStats={regions} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.tier"></TranslatableText>
                        <SelectInput key={tierKey} name="tierSelect" sortableStats={tiers} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.location"></TranslatableText>
                        <SelectInput key={locationKey} name="locationSelect" sortableStats={locations} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.poi"></TranslatableText>
                        <SelectInput key={poiKey} name="poiSelect" sortableStats={pois} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.charmClass"></TranslatableText>
                        <SelectInput key={classKey} name="classSelect" sortableStats={charmClasses} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.charmStat"></TranslatableText>
                        <SelectInput key={charmStatKey} name="charmStatSelect" sortableStats={charmStats} />
                    </div>
                    <div className={styles.selects}>
                        <TranslatableText identifier="items.searchForm.baseItem"></TranslatableText>
                        <SelectInput key={baseItemKey} name="baseItemSelect" sortableStats={baseItems} />
                    </div>
                </div>

            </div>
            <input type="text" name="searchName" className={styles.searchField} placeholder="Search Name" />
            <input type="text" name="searchLore" className={styles.searchField} placeholder="Search Lore" />
            <div>
                <input className={styles.submitButton} type="submit" />
                <input className={styles.warningButton} type="reset" />
            </div>
        </form>
    )
}