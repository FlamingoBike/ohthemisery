import Head from 'next/head'
import React from 'react';
import BuildForm from '../components/builder/buildForm'
import TranslatableText from '../components/translatableText';
import Axios from 'axios';
import AuthProvider from '../utils/authProvider';
import Fs from 'fs/promises';
import extras from '../public/items/extras.json';

function getLinkPreviewDescription(build, itemData) {
    if (!build) return ""
    let res = "";
    const buildParts = decodeURI(build).split("&");
    let itemNames = {
        mainhand: (buildParts.find(str => str.includes("m="))?.split("m=")[1]),
        offhand: (buildParts.find(str => str.includes("o="))?.split("o=")[1]),
        helmet: (buildParts.find(str => str.includes("h="))?.split("h=")[1]),
        chestplate: (buildParts.find(str => str.includes("c="))?.split("c=")[1]),
        leggings: (buildParts.find(str => str.includes("l="))?.split("l=")[1]),
        boots: (buildParts.find(str => str.includes("b="))?.split("b=")[1])
    };
    for (const type in itemNames) {
        if (itemNames[type] === undefined || !Object.keys(itemData).includes(itemNames[type])) {
            res += "None\n";
        } else {
            res += `${itemNames[type]}\n`
        }
    };

    return res;
}

export default function Builder({ build, itemData }) {
    const [itemsToDisplay, setItemsToDisplay] = React.useState({});
    function change(itemData) {
        setItemsToDisplay(itemData);
    }
    const [parentLoaded, setParentLoaded] = React.useState(false);

    React.useEffect(() => {
        setParentLoaded(true);
    }, []);

    const miscStats = [
        { type: "armor", name: "builder.stats.misc.armor", percent: false },
        { type: "agility", name: "builder.stats.misc.agility", percent: false },
        { type: "speedPercent", name: "builder.stats.misc.speed", percent: true },
        { type: "knockbackRes", name: "builder.stats.misc.kbResistance", percent: true },
        { type: "thorns", name: "builder.stats.misc.thorns", percent: false },
        { type: "fireTickDamage", name: "builder.stats.misc.fireTickDamage", percent: false }
    ];
    const healthStats = [
        { type: "healthFinal", name: "builder.stats.health.healthFinal", percent: false },
        { type: "currentHealth", name: "builder.stats.health.currentHealth", percent: false },
        { type: "healingRate", name: "builder.stats.health.healingRate", percent: true },
        { type: "effHealingRate", name: "builder.stats.health.effectiveHealingRate", percent: true },
        { type: "regenPerSec", name: "builder.stats.health.regenPerSecond", percent: false },
        { type: "regenPerSecPercent", name: "builder.stats.health.regenPerSecondPercent", percent: true },
        { type: "lifeDrainOnCrit", name: "builder.stats.health.lifeDrainOnCrit", percent: false },
        { type: "lifeDrainOnCritPercent", name: "builder.stats.health.lifeDrainOnCritPercent", percent: true }
    ];
    const DRStats = [
        { type: "meleeDR", name: "builder.stats.dr-ehp.melee", percent: true },
        { type: "projectileDR", name: "builder.stats.dr-ehp.projectile", percent: true },
        { type: "magicDR", name: "builder.stats.dr-ehp.magic", percent: true },
        { type: "blastDR", name: "builder.stats.dr-ehp.blast", percent: true },
        { type: "fireDR", name: "builder.stats.dr-ehp.fire", percent: true },
        { type: "fallDR", name: "builder.stats.dr-ehp.fall", percent: true },
        { type: "ailmentDR", name: "builder.stats.dr-ehp.ailment", percent: true }
    ];
    const healthNormalizedDRStats = [
        { type: "meleeHNDR", name: "builder.stats.dr-ehp.melee", percent: true },
        { type: "projectileHNDR", name: "builder.stats.dr-ehp.projectile", percent: true },
        { type: "magicHNDR", name: "builder.stats.dr-ehp.magic", percent: true },
        { type: "blastHNDR", name: "builder.stats.dr-ehp.blast", percent: true },
        { type: "fireHNDR", name: "builder.stats.dr-ehp.fire", percent: true },
        { type: "fallHNDR", name: "builder.stats.dr-ehp.fall", percent: true },
        { type: "ailmentHNDR", name: "builder.stats.dr-ehp.ailment", percent: true }
    ];
    const EHPStats = [
        { type: "meleeEHP", name: "builder.stats.dr-ehp.melee", percent: false },
        { type: "projectileEHP", name: "builder.stats.dr-ehp.projectile", percent: false },
        { type: "magicEHP", name: "builder.stats.dr-ehp.magic", percent: false },
        { type: "blastEHP", name: "builder.stats.dr-ehp.blast", percent: false },
        { type: "fireEHP", name: "builder.stats.dr-ehp.fire", percent: false },
        { type: "fallEHP", name: "builder.stats.dr-ehp.fall", percent: false },
        { type: "ailmentEHP", name: "builder.stats.dr-ehp.ailment", percent: false }
    ];
    const meleeStats = [
        { type: "attackSpeedPercent", name: "builder.stats.melee.attackSpeedPercent", percent: true },
        { type: "attackSpeed", name: "builder.stats.melee.attackSpeed", percent: false },
        { type: "attackDamagePercent", name: "builder.stats.melee.attackDamagePercent", percent: true },
        { type: "attackDamage", name: "builder.stats.melee.attackDamage", percent: false },
        { type: "attackDamageCrit", name: "builder.stats.melee.attackDamageCrit", percent: false },
        { type: "iframeDPS", name: "builder.stats.melee.iframeDps", percent: false },
        { type: "iframeCritDPS", name: "builder.stats.melee.iframeCritDps", percent: false }
    ];
    const projectileStats = [
        { type: "projectileDamagePercent", name: "builder.stats.projectile.projectileDamagePercent", percent: true },
        { type: "projectileDamage", name: "builder.stats.projectile.projectileDamage", percent: false },
        { type: "projectileSpeedPercent", name: "builder.stats.projectile.projectileSpeedPercent", percent: true },
        { type: "projectileSpeed", name: "builder.stats.projectile.projectileSpeed", percent: false },
        { type: "throwRatePercent", name: "builder.stats.projectile.throwRatePercent", percent: true },
        { type: "throwRate", name: "builder.stats.projectile.throwRate", percent: false }
    ];
    const magicStats = [
        { type: "magicDamagePercent", name: "builder.stats.magic.magicDamagePercent", percent: true },
        { type: "spellPowerPercent", name: "builder.stats.magic.spellPowerPercent", percent: true },
        { type: "spellDamage", name: "builder.stats.magic.spellDamage", percent: true },
        { type: "spellCooldownPercent", name: "builder.stats.magic.spellCooldownPercent", percent: true },
        { type: "divineJusticeDamage", name: "builder.stats.magic.divineJusticeDamage",percent:false}
    ];


    return (
        <div className="container-fluid">
            <Head>
                <title>Monumenta Builder</title>
                <meta property="og:site_name" content="OHTHEMISERY.TK" />
                <meta property="og:image" content="/favicon.ico" />
                <meta name="description" content={`${getLinkPreviewDescription(build, itemData)}`} />
                <meta name="keywords" content="Monumenta, Minecraft, MMORPG, Items, Builder" />
            </Head>
            <main>
                <div className="row mb-5">
                    <div className="col-12">
                        <h1 className="text-center">Monumenta Builder</h1>
                    </div>
                </div>
                <BuildForm update={change} build={build} parentLoaded={parentLoaded} itemData={itemData}></BuildForm>
                <div className="row justify-content-center mb-2">
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.misc"></TranslatableText></h5>
                        <h6 className="text-center fw-bold">&nbsp;</h6>
                        {
                            miscStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.health"></TranslatableText></h5>
                        <h6 className="text-center fw-bold">&nbsp;</h6>
                        {
                            healthStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.damageReduction"></TranslatableText></h5>
                        <h6 className="text-center fw-bold"><TranslatableText identifier="builder.statCategories.damageReduction.sub"></TranslatableText></h6>
                        {
                            DRStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.damageReductionHealthNormalized"></TranslatableText></h5>
                        <h6 className="text-center fw-bold"><TranslatableText identifier="builder.statCategories.damageReductionHealthNormalized.sub"></TranslatableText></h6>
                        {
                            healthNormalizedDRStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.effectiveHealth"></TranslatableText></h5>
                        <h6 className="text-center fw-bold">&nbsp;</h6>
                        {
                            EHPStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.melee"></TranslatableText></h5>
                        <h6 className="text-center fw-bold">&nbsp;</h6>
                        {
                            meleeStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.projectile"></TranslatableText></h5>
                        <h6 className="text-center fw-bold">&nbsp;</h6>
                        {
                            projectileStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                    <div className="col-auto text-center border border-dark mx-2 py-2">
                        <h5 className="text-center fw-bold mb-0"><TranslatableText identifier="builder.statCategories.magic"></TranslatableText></h5>
                        <h6 className="text-center fw-bold">&nbsp;</h6>
                        {
                            magicStats.map(stat =>
                                (itemsToDisplay[stat.type] !== undefined) ?
                                    <div key={stat.type}>
                                        <p className="mb-1 mt-1"><b><TranslatableText identifier={stat.name}></TranslatableText>: </b>{itemsToDisplay[stat.type]}{stat.percent ? "%" : ""}</p>
                                    </div> : ""
                            )
                        }
                    </div>
                </div>
            </main>
        </div>
    )
}

export async function getServerSideProps(context) {
    let itemData = null;
    if (AuthProvider.isUsingApi()) {
        const response = await Axios.get(AuthProvider.getApiPath(), {headers: {'Authorization': AuthProvider.getAuthorizationData()}});
        itemData = response.data;
    } else {
        itemData = JSON.parse(await Fs.readFile('public/items/itemData.json'));
    }
    let build = context.query?.build ? context.query.build : null;

    // Add OTM extra info based on item's name
    // (so that it gets copied the same to each masterwork level)
    for (const item in itemData) {
        let itemStats = itemData[item];
        // Extras
        if (extras[itemStats.name]) {
            itemData[item].extras = extras[itemStats.name];
        }
        // Exalted
        if (itemStats.masterwork) {
            // If an item with the base, non-masterwork name exists, as a key
            if (itemData[itemStats.name]) {
                // Modify its name to have an "EX" at the start
                let exName = `EX ${itemStats.name}`;
                let mwExName = `${exName}-${itemData[item].masterwork}`;
                itemData[mwExName] = itemData[item];
                itemData[mwExName].name = exName;
                delete itemData[item];
            }
        }
    }

    return {
        props: {
            build,
            itemData
        }
    };
}
