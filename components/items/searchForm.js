import React from 'react';
import styles from '../../styles/SearchForm.module.css';
import SelectWithTriggers from './selectWithTriggers';
import SelectInput from './selectInput';
import extras from '../../public/items/extras.json';

export default function SearchForm({ update, itemData }) {
    const [itemStatKey, setItemStatKey] = React.useState(getResetKey("search"));
    const [itemTypeKey, setItemTypeKey] = React.useState(getResetKey("itemType"));
    const [regionKey, setRegionKey] = React.useState(getResetKey("region"));
    const [tierKey, setTierKey] = React.useState(getResetKey("tier"));
    const [locationKey, setLocationKey] = React.useState(getResetKey("location"));
    const [poiKey, setPoiKey] = React.useState(getResetKey("poi"));
    const [classKey, setClassKey] = React.useState(getResetKey("class"));
    const [charmStatKey, setCharmStatKey] = React.useState(getResetKey("charmStat"));
    const [baseItemKey, setBaseItemKey] = React.useState(getResetKey("baseItem"));
    const form = React.useRef();
    const searchContainer = React.useRef();
    
    const itemTypes = ["Helmet", "Chestplate", "Leggings", "Boots", "Axe", "Wand",
        "Scythe", "Pickaxe", "Shovel", "Bow", "Crossbow", "Snowball", "Trident",
        "Projectile", "Offhand Shield", "Mainhand Shield", "Mainhand Sword",
        "Offhand Sword", "Mainhand", "Offhand", "Consumable", "Misc", "Charm"];
    const charmClasses = ["Alchemist", "Mage", "Warlock", "Rogue", "Warrior",
        "Cleric", "Scout", "Shaman", "Generalist"];
    let sortableStats = [];
    let regions = [];
    let tiers = [];
    let locations = [];
    let pois = [];
    let charmStats = [];
    let baseItems = [];
    
    const categories = [
        new SearchCategory("Item Type", "items.searchForm.itemType", (uniqueKey) => {
            return <SelectInput key={itemTypeKey} name={`itemTypeSelect-${uniqueKey}`} baseTranslationString="items.type" sortableStats={itemTypes} />
        }),
        new SearchCategory("Item Stat", "items.searchForm.itemStat", (uniqueKey) => {
            return <SelectInput key={itemStatKey} name={`itemStatSelect-${uniqueKey}`} sortableStats={sortableStats} />
        }),
        new SearchCategory("Region", "items.searchForm.region", (uniqueKey) => {
            return <SelectInput key={regionKey} name={`regionSelect-${uniqueKey}`} sortableStats={regions} />
        }),
        new SearchCategory("Tier", "items.searchForm.tier", (uniqueKey) => {
            return <SelectInput key={tierKey} name={`tierSelect-${uniqueKey}`} sortableStats={tiers} />
        }),
        new SearchCategory("Location", "items.searchForm.location", (uniqueKey) => {
            return <SelectInput key={locationKey} name={`locationSelect-${uniqueKey}`} sortableStats={locations} />
        }),
        new SearchCategory("POI", "items.searchForm.poi", (uniqueKey) => {
            return <SelectInput key={poiKey} name={`poiSelect-${uniqueKey}`} sortableStats={pois} />
        }),
        new SearchCategory("Charm Stat", "items.searchForm.charmStat", (uniqueKey) => {
            return <SelectInput key={charmStatKey} name={`charmStatSelect-${uniqueKey}`} sortableStats={charmStats} />
        }),
        new SearchCategory("Charm Class", "items.searchForm.charmClass", (uniqueKey) => {
            return <SelectInput key={classKey} name={`classSelect-${uniqueKey}`} sortableStats={charmClasses} />
        }),
        new SearchCategory("Base Item", "items.searchForm.baseItem", (uniqueKey) => {
            return <SelectInput key={baseItemKey} name={`baseItemSelect-${uniqueKey}`} sortableStats={baseItems} />
        })
    ];

    const deleteFilter = React.useCallback((key) => {
        setFilters(oldFilters => oldFilters.filter(f => f.uniqueKey != key));
    }, []);

    const [filters, setFilters] = React.useState([{"activeCategory": null, "selected": null, "uniqueKey": new Date().getTime()}]);

    function sendUpdate(event = {}) {
        if (event.type === "submit") {
            event.preventDefault()
        }
        update(Object.fromEntries(new FormData(form.current).entries()));
    }

    function getResetKey(name) {
        return name + new Date()
    }

    function resetForm() {
        setItemStatKey(getResetKey("search"));
        setItemTypeKey(getResetKey("itemType"));
        setRegionKey(getResetKey("region"));
        setTierKey(getResetKey("tier"));
        setLocationKey(getResetKey("location"));
        setPoiKey(getResetKey("poi"));
        setClassKey(getResetKey("class"));
        setCharmStatKey(getResetKey("charmStat"));
        setBaseItemKey(getResetKey("baseItem"));
        setFilters([{"activeCategory": null, "selected": null, "uniqueKey": new Date().getTime()}]);
    }

    function disableRightClick(event) {
        event.preventDefault()
    }

    generateSortableItemStats(itemData);
    generateRegions();
    generateTiers(itemData);
    generateSortableCharmStats(itemData);
    generateLocations(itemData);
    generatePOIs();
    generateBaseItems(itemData);

    function addFilter() {
        setFilters(oldFilters => [...oldFilters, {"activeCategory": null, "selected": null, "uniqueKey": new Date().getTime()}]);
    }

    return (
        <form className={styles.searchForm} onSubmit={sendUpdate} onReset={resetForm} onContextMenu={disableRightClick} ref={form}>
            <div className={styles.searchContainer} ref={searchContainer}>
                {
                    filters.map(f => <div className={`my-1 ${styles.searchControls}`} key={`div-${f.uniqueKey}`}><SelectWithTriggers className={`my-1 d-inline`} key={f.uniqueKey} name="categorySelect" opts={categories} index={f.uniqueKey} deleteCallback={deleteFilter} /></div>)
                }
            </div>

            <input type="text" name="searchName" className={styles.searchField} placeholder="Search Name" />
            <input type="text" name="searchLore" className={styles.searchField} placeholder="Search Lore" />
            <div>
                <input className={styles.addFilterButton} type='button' value='＋' onClick={addFilter} />
                <input className={styles.submitButton} type="submit" />
                <input className={styles.warningButton} type="reset" />
            </div>
        </form>
    )

    function generateSortableItemStats(itemData) {
        sortableStats = [];
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

    function generateRegions() {
        regions = [];
        let uniqueRegions = {};
        Object.keys(itemData).map(item => itemData[item].region).filter(regionName => regionName != undefined).forEach(regionName => {
            uniqueRegions[regionName] = 1;
        });
        Object.keys(uniqueRegions).forEach(regionName => regions.push(regionName));
    }

    function generateTiers(itemData) {
        tiers = [];
        let uniqueTiers = {};
        Object.keys(itemData).map(item => itemData[item].tier).filter(tierName => tierName != undefined).forEach(tierName => {
            uniqueTiers[tierName] = 1;
        });
        // Remove the Charm tier since there is a checkbox for it.
        delete uniqueTiers.Charm;
        Object.keys(uniqueTiers).forEach(tierName => tiers.push(tierName));
    }

    function generateSortableCharmStats(itemData) {
        charmStats = [];
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
        locations = [];
        let uniqueLocations = {};
        Object.keys(itemData).map(item => itemData[item].location).filter(locationName => locationName != undefined).forEach(locationName => {
            uniqueLocations[locationName] = 1;
        });
        Object.keys(uniqueLocations).forEach(locationName => locations.push(locationName));
    }
    
    function generatePOIs() {
        pois = [];
        let uniquePois = {};
        Object.keys(extras).filter(extra => extras[extra].poi != undefined).map(extra => extras[extra].poi).forEach(poiName => {
            uniquePois[poiName] = 1;
        });
        Object.keys(uniquePois).forEach(poiName => pois.push(poiName));
    }
    
    function generateBaseItems(itemData) {
        baseItems = [];
        let uniqueBaseItems = {};
        Object.keys(itemData).map(item => itemData[item].base_item).filter(baseItemName => baseItemName != undefined).forEach(baseItemName => {
            uniqueBaseItems[baseItemName] = 1;
        });
        Object.keys(uniqueBaseItems).forEach(baseItemName => baseItems.push(baseItemName));
    }
}

class SearchCategory {
    constructor(name, translatableName, spawnChildren) {
        this.name = name;
        this.translatableName = translatableName;
        this.spawnChildren = spawnChildren;
    };

    select(uniqueKey) {
        return this.spawnChildren(uniqueKey);
    }
}