import Percentage from './percentage';

const types = ["mainhand", "offhand", "helmet", "chestplate", "leggings", "boots"];

class Stats {
    constructor(itemData, formData, enabledBoxes, extraStats) {
        this.enabledBoxes = enabledBoxes;
        this.itemNames = {
            "mainhand": formData.mainhand,
            "offhand": formData.offhand,
            "helmet": formData.helmet,
            "chestplate": formData.chestplate,
            "leggings": formData.leggings,
            "boots": formData.boots
        };

        this.fullItemData = {};
        types.forEach(type => {
            this.fullItemData[type] = (this.itemNames[type] != "None") ?
                (itemData[this.itemNames[type]]) ? itemData[this.itemNames[type]] : {masterwork: 0} : {masterwork: 0};
        });

        this.itemStats = {};
        types.forEach(type => {
            this.itemStats[type] = (this.itemNames[type] != "None") ?
                (itemData[this.itemNames[type]]) ? itemData[this.itemNames[type]].stats : undefined : undefined
        })

        this.situationals = {
            shielding: { enabled: enabledBoxes.shielding, level: 0 },
            poise: { enabled: enabledBoxes.poise, level: 0 },
            inure: { enabled: enabledBoxes.inure, level: 0 },
            steadfast: { enabled: enabledBoxes.steadfast, level: 0 },
            guard: { enabled: enabledBoxes.guard, level: 0 },
            ethereal: { enabled: enabledBoxes.ethereal, level: 0 },
            reflexes: { enabled: enabledBoxes.reflexes, level: 0 },
            evasion: { enabled: enabledBoxes.evasion, level: 0 },
            tempo: { enabled: enabledBoxes.tempo, level: 0 },
            cloaked: { enabled: enabledBoxes.cloaked, level: 0},
            secondwind: { enabled: enabledBoxes.secondwind, level: 0 },
            adaptability: { enabled: true, level: 0 }
        };
        this.tenacity = (formData.tenacity) ? formData.tenacity : 0;
        this.vitality = (formData.vitality) ? formData.vitality : 0;
        this.vigor = (formData.vigor) ? formData.vigor : 0;
        this.focus = (formData.focus) ? formData.focus : 0;
        this.perspicacity = (formData.perspicacity) ? formData.perspicacity : 0;

        this.currentHealthPercent = (formData.health) ? new Percentage(formData.health) : new Percentage(100);
        this.situationalCap = (formData.situationalCap) ? formData.situationalCap : 30;

        this.extraDamageMultiplier = 1;
        this.extraResistanceMultiplier = new Percentage(100);
        this.extraHealthMultiplier = 1;
        this.extraSpeedMultiplier = 1;
        if (extraStats) {
            if (extraStats.damageMultipliers) {
                this.extraDamageMultiplier = extraStats.damageMultipliers.map(percObject => percObject.val)
                    .reduce((accumulator, val) => accumulator * val, 1);
            }
            if (extraStats.resistanceMultipliers) {
                extraStats.resistanceMultipliers.map(percObject => percObject.val)
                    .forEach(val => this.extraResistanceMultiplier.preciseMul(2 - val, false));
            }
            if (extraStats.healthMultipliers) {
                this.extraHealthMultiplier = extraStats.healthMultipliers.map(percObject => percObject.val)
                    .reduce((accumulator, val) => accumulator * val, 1);
            }
            if (extraStats.speedMultipliers) {
                this.extraSpeedMultiplier = extraStats.speedMultipliers.map(percObject => percObject.val)
                    .reduce((accumulator, val) => accumulator * val, 1);
            }
        }

        this.setDefaultValues();
        this.sumAllStats();
        this.adjustStats();
        this.calculateDefenseStats();
        this.calculateOffenseStats();

        // This hopefully finally fixes the precision errors with HP calculations.
        this.healthFinal = Number(this.healthFinal.toFixed(2));
        this.currentHealth = Number(this.currentHealth.toFixed(2));
    }

    calculateOffenseStats() {
        if (this.enabledBoxes.versatile) {
            let extraAttackDamagePercent = (this.projectileDamagePercent.perc - 100) * 0.5;
            let extraProjectileDamagePercent = (this.attackDamagePercent.perc - 100) * 0.4;
            this.attackDamagePercent.add(extraAttackDamagePercent);
            this.projectileDamagePercent.add(extraProjectileDamagePercent);
        }

        // Melee Stats
        let attackDamage = this.sumNumberStat(this.itemStats.mainhand, "attack_damage_base", this.attackDamage)
            * this.attackDamagePercent.val
            * (1 + 0.0075 * Number(this.vigor))
            * ((this.currentHealthPercent.perc <= 50) ? 1 - 0.1 * this.crippling : 1)
            * this.extraDamageMultiplier;
        this.attackDamagePercent = this.attackDamagePercent.toFixedPerc(2);
        this.attackDamage = attackDamage.toFixed(2);
        let attackSpeed = (this.sumNumberStat(this.itemStats.mainhand, "attack_speed_base", this.attackSpeed) + this.attackSpeedFlatBonus) * this.attackSpeedPercent.val;
        this.attackSpeedPercent = this.attackSpeedPercent.toFixedPerc(2);
        this.attackSpeed = attackSpeed.toFixed(2);
        let attackDamageCrit = (attackDamage * 1.5)
        this.attackDamageCrit = attackDamageCrit.toFixed(2);
        this.iframeDPS = ((attackSpeed >= 2) ? attackDamage * 2 : attackDamage * attackSpeed).toFixed(2);
        this.iframeCritDPS = ((attackSpeed >= 2) ? attackDamageCrit * 2 : attackDamageCrit * attackSpeed).toFixed(2);


        // Projectile Stats
        let projectileDamage = this.sumNumberStat(this.itemStats.mainhand, "projectile_damage_base", this.projectileDamage)
            * this.projectileDamagePercent.val
            * (1 + 0.0075 * Number(this.focus))
            * this.extraDamageMultiplier;
        this.projectileDamagePercent = this.projectileDamagePercent.toFixedPerc(2);
        this.projectileDamage = projectileDamage.toFixed(2);
        let projectileSpeed = this.sumNumberStat(this.itemStats.mainhand, "projectile_speed_base", this.projectileSpeed) * this.projectileSpeedPercent.val;
        this.projectileSpeedPercent = this.projectileSpeedPercent.toFixedPerc(2);
        this.projectileSpeed = projectileSpeed.toFixed(2);
        let throwRate = this.sumNumberStat(this.itemStats.mainhand, "throw_rate_base", this.throwRate) * this.throwRatePercent.val;
        this.throwRatePercent = this.throwRatePercent.toFixedPerc(2);
        this.throwRate = throwRate.toFixed(2);

        // Magic Stats
        this.spellPowerPercent.add(this.sumNumberStat(this.itemStats.mainhand, "spell_power_base", 0));
        this.spellDamage = (
            this.spellPowerPercent.duplicate()
                .mulP(this.magicDamagePercent)
                .mul(1 + 0.0075 * Number(this.perspicacity), false)
                .mul(this.extraDamageMultiplier, false)
        ).toFixedPerc(2);
        this.spellPowerPercent = this.spellPowerPercent.toFixedPerc(2);
        this.magicDamagePercent = this.magicDamagePercent.toFixedPerc(2);
        this.spellCooldownPercent = this.spellCooldownPercent
            .mul(Math.pow(0.95, this.aptitude + this.ineptitude), false)
            .toFixedPerc(2);
        // Divine Justice (look, I would argue it's melee, but it's also magic, so I'm just putting it below both)
        if (this.enabledBoxes.divinejustice) {
          let divineJusticeDamage = ((attackDamageCrit * 0.2) + 5) * 1.15 * (this.magicDamagePercent/100);
          this.divineJusticeDamage = divineJusticeDamage.toFixed(2);
        }
    }

    calculateDefenseStats() {
        let drs = this.calculateDamageReductions();

        // Select to show either the regular dr, or dr with second wind currently active based on hp remaining
        let drType = (this.situationals.secondwind.enabled) ? "secondwind" : "base";

        // Regular Damage Reductions
        this.meleeDR = drs.melee[drType].toFixedPerc(2);
        this.projectileDR = drs.projectile[drType].toFixedPerc(2);
        this.magicDR = drs.magic[drType].toFixedPerc(2);
        this.blastDR = drs.blast[drType].toFixedPerc(2);
        this.fireDR = drs.fire[drType].toFixedPerc(2);
        this.fallDR = drs.fall[drType].toFixedPerc(2);
        this.ailmentDR = drs.ailment[drType].toFixedPerc(2);

        // Effective HP
        if (this.situationals.secondwind.level == 0 || drType == "base") {
            this.meleeEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.melee.base.val)).toFixed(2);
            this.projectileEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.projectile.base.val)).toFixed(2);
            this.magicEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.magic.base.val)).toFixed(2);
            this.blastEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.blast.base.val)).toFixed(2);
            this.fireEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.fire.base.val)).toFixed(2);
            this.fallEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.fall.base.val)).toFixed(2);
            this.ailmentEHP = (this.healthFinal * this.currentHealthPercent.val / (1 - drs.ailment.base.val)).toFixed(2);
        } else {
            let hpNoSecondWind = Math.max(0, (this.currentHealth - this.healthFinal * 0.5));
            let hpSecondWind = Math.min(this.currentHealth, this.healthFinal * 0.5);
            this.meleeEHP = (hpNoSecondWind / (1 - drs.melee.base.val) + hpSecondWind / (1 - drs.melee.secondwind.val)).toFixed(2);
            this.projectileEHP = (hpNoSecondWind / (1 - drs.projectile.base.val) + hpSecondWind / (1 - drs.projectile.secondwind.val)).toFixed(2);
            this.magicEHP = (hpNoSecondWind / (1 - drs.magic.base.val) + hpSecondWind / (1 - drs.magic.secondwind.val)).toFixed(2);
            this.blastEHP = (hpNoSecondWind / (1 - drs.blast.base.val) + hpSecondWind / (1 - drs.blast.secondwind.val)).toFixed(2);
            this.fireEHP = (hpNoSecondWind / (1 - drs.fire.base.val) + hpSecondWind / (1 - drs.fire.secondwind.val)).toFixed(2);
            this.fallEHP = (hpNoSecondWind / (1 - drs.fall.base.val) + hpSecondWind / (1 - drs.fall.secondwind.val)).toFixed(2);
            this.ailmentEHP = (hpNoSecondWind / (1 - drs.ailment.base.val) + hpSecondWind / (1 - drs.ailment.secondwind.val)).toFixed(2);
        }

        // Health Normalized Damage Reductions
        this.meleeHNDR = new Percentage((1 - ((1 - drs.melee[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
        this.projectileHNDR = new Percentage((1 - ((1 - drs.projectile[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
        this.magicHNDR = new Percentage((1 - ((1 - drs.magic[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
        this.blastHNDR = new Percentage((1 - ((1 - drs.blast[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
        this.fireHNDR = new Percentage((1 - ((1 - drs.fire[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
        this.fallHNDR = new Percentage((1 - ((1 - drs.fall[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
        this.ailmentHNDR = new Percentage((1 - ((1 - drs.ailment[drType].val) / (this.healthFinal / 20))), false).toFixedPerc(2);
    }

    calculateDamageTaken(noArmor, prot, fragility, protmodifier, earmor, eagility) {
        let damageTaken = {};
        damageTaken.base = ((noArmor) ? 100 * (1 - this.worldlyProtection * 0.1) * Math.pow(0.96, (prot * protmodifier - fragility * protmodifier)) :
            100 * (1 - this.worldlyProtection * 0.1) * Math.pow(0.96, ((prot * protmodifier - fragility * protmodifier) + earmor + eagility) - (0.5 * earmor * eagility / (earmor + eagility))));

        damageTaken.secondwind = ((noArmor) ? 100 * (1 - this.worldlyProtection * 0.1) * Math.pow(0.96, (prot * protmodifier - fragility * protmodifier)) :
            100 * (1 - this.worldlyProtection * 0.1) * Math.pow(0.96, ((prot * protmodifier - fragility * protmodifier) + earmor + eagility) - (0.5 * earmor * eagility / (earmor + eagility))));
        damageTaken.secondwind *= Math.pow(0.9, this.situationals.secondwind.level);

        damageTaken.base = damageTaken.base
            * (1 - (this.tenacity * 0.005))
            * (this.extraResistanceMultiplier.val);

        damageTaken.secondwind = damageTaken.secondwind
            * (1 - (this.tenacity * 0.005))
            * (this.extraResistanceMultiplier.val);

        return damageTaken;
    }

    calculateDamageReductions() {
        /*
        Calculates all things damage reduction related.
        */

        // Prevents things like Auric Tiara from breaking the DR calculations
        // since having negative armor/agility doesn't mean you will take
        // additional damage from enemy attacks.
        let armor = (this.armor < 0) ? 0 : this.armor;
        let agility = (this.agility < 0) ? 0 : this.agility;

        let moreAgility = false;
        let moreArmor = false;
        let hasEqual = false;
        (agility > armor) ? moreAgility = true : (armor > agility) ? moreArmor = true : hasEqual = true;
        let hasNothing = (hasEqual && armor == 0);

        // For situationals with 20% in mind.
        // Capped at a total of this.situationalCap armor/agility effectiveness (20 in r1, 30 in r2-r3).
        let situationalArmor = (this.situationals.adaptability.level > 0) ? Math.min(Math.max(agility, armor), this.situationalCap) * 0.2 : Math.min(armor, this.situationalCap) * 0.2;
        let situationalAgility = (this.situationals.adaptability.level > 0) ? Math.min(Math.max(agility, armor), this.situationalCap) * 0.2 : Math.min(agility, this.situationalCap) * 0.2;

        let etherealSit = (this.situationals.ethereal.enabled) ? situationalAgility * this.situationals.ethereal.level : 0;
        let tempoSit = (this.situationals.tempo.enabled) ? situationalAgility * this.situationals.tempo.level : 0;
        let evasionSit = (this.situationals.evasion.enabled) ? situationalAgility * this.situationals.evasion.level : 0;
        let reflexesSit = (this.situationals.reflexes.enabled) ? situationalAgility * this.situationals.reflexes.level : 0;
        let shieldingSit = (this.situationals.shielding.enabled) ? situationalArmor * this.situationals.shielding.level : 0;
        let poiseSit = (this.situationals.poise.enabled) ? ((this.currentHealthPercent.val >= 0.9) ? situationalArmor * this.situationals.poise.level : 0) : 0;
        let inureSit = (this.situationals.inure.enabled) ? situationalArmor * this.situationals.inure.level : 0;
        let guardSit = (this.situationals.guard.enabled) ? situationalArmor * this.situationals.guard.level : 0;
        let cloakedSit = (this.situationals.cloaked.enabled) ? situationalAgility * this.situationals.cloaked.level : 0;

        let steadfastScaling = 0.33;
        let steadfastMaxScaling = 20;
        let steadfastLowerBound = 1 - (steadfastMaxScaling / steadfastScaling / 100);
        let steadfastArmor = (1 - Math.max(steadfastLowerBound, Math.min(1, this.currentHealthPercent.val))) * steadfastScaling *
            Math.min(((this.situationals.adaptability.level > 0 && moreAgility) ? agility : (moreArmor) ? armor : (this.situationals.adaptability.level == 0) ? armor : 0), this.situationalCap);

        let steadfastSit = (this.situationals.steadfast.enabled) ? steadfastArmor * this.situationals.steadfast.level : 0;

        let sumSits = etherealSit + tempoSit + evasionSit + reflexesSit + shieldingSit + poiseSit + inureSit + guardSit + cloakedSit;
        let sumArmorSits = shieldingSit + poiseSit + inureSit + guardSit;
        let sumAgiSits = etherealSit + tempoSit + evasionSit + reflexesSit + cloakedSit;

        let armorPlusSits = armor;
        if (this.situationals.adaptability.level > 0) {
            if (moreArmor) {
                armorPlusSits += sumSits;
            }
        } else {
            armorPlusSits += sumArmorSits;
        }
        let armorPlusSitsSteadfast = armorPlusSits + steadfastSit;

        let agilityPlusSits = agility;
        if (this.situationals.adaptability.level > 0) {
            if (moreAgility) {
                agilityPlusSits += sumSits;
            }
        } else {
            agilityPlusSits += sumAgiSits;
        }

        let halfArmor = armorPlusSitsSteadfast / 2;
        let halfAgility = agilityPlusSits / 2;

        let meleeDamage = this.calculateDamageTaken(hasNothing, this.meleeProt, this.meleeFragility, 2, armorPlusSitsSteadfast, agilityPlusSits);
        let projectileDamage = this.calculateDamageTaken(hasNothing, this.projectileProt, this.projectileFragility, 2, armorPlusSitsSteadfast, agilityPlusSits);
        let magicDamage = this.calculateDamageTaken(hasNothing, this.magicProt, this.magicFragility, 2, armorPlusSitsSteadfast, agilityPlusSits);
        let blastDamage = this.calculateDamageTaken(hasNothing, this.blastProt, this.blastFragility, 2, armorPlusSitsSteadfast, agilityPlusSits);
        let fireDamage = this.calculateDamageTaken(hasNothing, this.fireProt, this.fireFragility, 2, halfArmor, halfAgility);
        let fallDamage = this.calculateDamageTaken(hasNothing, this.fallProt, 0, 3, halfArmor, halfAgility);
        let ailmentDamage = this.calculateDamageTaken(true, 0, 0, 0, 0, 0);

        let reductions = {
            melee: { base: new Percentage(100 - meleeDamage.base), secondwind: new Percentage(100 - meleeDamage.secondwind) },
            projectile: { base: new Percentage(100 - projectileDamage.base), secondwind: new Percentage(100 - projectileDamage.secondwind) },
            magic: { base: new Percentage(100 - magicDamage.base), secondwind: new Percentage(100 - magicDamage.secondwind) },
            blast: { base: new Percentage(100 - blastDamage.base), secondwind: new Percentage(100 - blastDamage.secondwind) },
            fire: { base: new Percentage(100 - fireDamage.base), secondwind: new Percentage(100 - fireDamage.secondwind) },
            fall: { base: new Percentage(100 - fallDamage.base), secondwind: new Percentage(100 - fallDamage.secondwind) },
            ailment: { base: new Percentage(100 - ailmentDamage.base), secondwind: new Percentage(100 - ailmentDamage.secondwind) }
        }

        return reductions;
    }

    sumNumberStat(itemStats, statName, defaultIncrement) {
        if (!itemStats) return 0;
        return (itemStats[statName]) ? Number(itemStats[statName]) : (defaultIncrement) ? defaultIncrement : 0;
    }

    sumEnchantmentStat(itemStats, enchName, perLevelMultiplier) {
        if (!itemStats) return (perLevelMultiplier) ? perLevelMultiplier : 0;
        return (itemStats[enchName]) ? Number(itemStats[enchName]) * perLevelMultiplier : 0;
    }

    adjustStats() {
        /*
        Minor calculations to adjust the stat values
        */
        // Calculate final health
        this.healthFinal = this.healthFlat * this.healthPercent.val * (1 + 0.01 * Number(this.vitality)) * this.extraHealthMultiplier;
        // Current health (percentage of max health based on player input)
        this.currentHealth = this.healthFinal * this.currentHealthPercent.val;
        // Fix speed percentage to account for base speed
        this.speedPercent = this.speedPercent
            .mul((this.speedFlat) / 0.1, false)
            .mul(((this.currentHealthPercent.perc <= 50) ? 1 - 0.1 * this.crippling : 1), false)
            .mul(this.extraSpeedMultiplier, false)
            .toFixedPerc(2);

        // Fix knockback resistance to be percentage and cap at 100
        this.knockbackRes = (this.knockbackRes > 10) ? 100 : this.knockbackRes * 10;
        // Calculate effective healing rate
        let effHealingNonRounded = new Percentage(((20 / this.healthFinal) * this.healingRate.val), false);
        this.effHealingRate = effHealingNonRounded.toFixedPerc(2);
        // Fix regen to the actual value per second
        let regenPerSecNonRounded = 0.33 * Math.sqrt(this.regenPerSec) * this.healingRate.val;
        this.regenPerSec = regenPerSecNonRounded.toFixed(2);
        // Calculate %hp regen per sec
        this.regenPerSecPercent = new Percentage(((regenPerSecNonRounded / this.healthFinal)), false).toFixedPerc(2);
        // Fix life drain on crit
        let lifeDrainOnCritFixedNonRounded = (Math.sqrt(this.lifeDrainOnCrit)) * this.healingRate.val;
        this.lifeDrainOnCrit = lifeDrainOnCritFixedNonRounded.toFixed(2);
        // Don't need healingRate as a percentage object anymore, turn it into the display string
        this.healingRate = this.healingRate.toFixedPerc(2);
        // Calculate %hp regained from life drain on crit
        this.lifeDrainOnCritPercent = new Percentage((lifeDrainOnCritFixedNonRounded / this.healthFinal), false).toFixedPerc(2);
        // Add to thorns damage
        this.thorns = (this.thorns * this.thornsPercent.val).toFixed(2);
    }

    sumAllStats() {
        /*
        Add up all the stats from the items
        */
        Object.keys(this.itemStats).forEach(type => {
            let itemStats = this.itemStats[type];
            if (itemStats !== undefined) {
                this.healthPercent.add(this.sumNumberStat(itemStats, "max_health_percent"));
                this.healthFlat += this.sumNumberStat(itemStats, "max_health_flat");
                this.agility += this.sumNumberStat(itemStats, "agility");
                this.armor += this.sumNumberStat(itemStats, "armor");
                this.speedPercent.add(this.sumNumberStat(itemStats, "speed_percent"));
                this.speedFlat += this.sumNumberStat(itemStats, "speed_flat");
                this.knockbackRes += this.sumNumberStat(itemStats, "knockback_resistance_flat");
                this.thorns += this.sumNumberStat(itemStats, "thorns_flat");
                this.thornsPercent.add(this.sumNumberStat(itemStats, "thorns_percent"));
                this.throwRatePercent.add(this.sumNumberStat(itemStats, "throw_rate_percent"));
                this.fireTickDamage += this.sumNumberStat(itemStats, "inferno");

                this.healingRate
                    .add(this.sumEnchantmentStat(itemStats, "curse_of_anemia", -10))
                    .add(this.sumEnchantmentStat(itemStats, "sustenance", 10));
                this.regenPerSec += this.sumEnchantmentStat(itemStats, "regeneration", 1);
                this.lifeDrainOnCrit += this.sumEnchantmentStat(itemStats, "life_drain", 1);

                this.meleeProt += this.sumNumberStat(itemStats, "melee_protection");
                this.projectileProt += this.sumNumberStat(itemStats, "projectile_protection");
                this.magicProt += this.sumNumberStat(itemStats, "magic_protection");
                this.blastProt += this.sumNumberStat(itemStats, "blast_protection");
                this.fireProt += this.sumNumberStat(itemStats, "fire_protection");
                this.fallProt += this.sumNumberStat(itemStats, "feather_falling");

                this.meleeFragility += this.sumNumberStat(itemStats, "melee_fragility");
                this.projectileFragility += this.sumNumberStat(itemStats, "projectile_fragility");
                this.magicFragility += this.sumNumberStat(itemStats, "magic_fragility");
                this.blastFragility += this.sumNumberStat(itemStats, "blast_fragility");
                this.fireFragility += this.sumNumberStat(itemStats, "fire_fragility");

                this.attackDamagePercent.add(this.sumNumberStat(itemStats, "attack_damage_percent"));
                this.attackSpeedPercent.add(this.sumNumberStat(itemStats, "attack_speed_percent"));
                this.attackSpeedFlatBonus += this.sumNumberStat(itemStats, "attack_speed_flat");

                this.projectileDamagePercent.add(this.sumNumberStat(itemStats, "projectile_damage_percent"));
                this.projectileSpeedPercent.add(this.sumNumberStat(itemStats, "projectile_speed_percent"));

                this.magicDamagePercent.add(this.sumNumberStat(itemStats, "magic_damage_percent"));

                this.aptitude += this.sumEnchantmentStat(itemStats, "aptitude", 1);
                this.ineptitude += this.sumEnchantmentStat(itemStats, "ineptitude", -1);

                this.worldlyProtection += this.sumNumberStat(itemStats, "worldly_protection");

                this.situationals.shielding.level += this.sumNumberStat(itemStats, "shielding");
                this.situationals.poise.level += this.sumNumberStat(itemStats, "poise");
                this.situationals.inure.level += this.sumNumberStat(itemStats, "inure");
                this.situationals.steadfast.level += this.sumNumberStat(itemStats, "steadfast");
                this.situationals.guard.level += this.sumNumberStat(itemStats, "guard");
                this.situationals.ethereal.level += this.sumNumberStat(itemStats, "ethereal");
                this.situationals.reflexes.level += this.sumNumberStat(itemStats, "reflexes");
                this.situationals.evasion.level += this.sumNumberStat(itemStats, "evasion");
                this.situationals.tempo.level += this.sumNumberStat(itemStats, "tempo");
                this.situationals.cloaked.level += this.sumNumberStat(itemStats, "cloaked");
                this.situationals.adaptability.level += this.sumNumberStat(itemStats, "adaptability");
                this.situationals.secondwind.level += this.sumNumberStat(itemStats, "second_wind");

                this.crippling += this.sumNumberStat(itemStats, "curse_of_crippling");
                this.corruption += this.sumNumberStat(itemStats, "curse_of_corruption");
            }
        });
    }

    setDefaultValues() {
        this.agility = 0,
        this.armor = 0,
        this.speedPercent = new Percentage(100),
        this.speedFlat = 0.1,
        this.knockbackRes = 0,
        this.thorns = 0,
        this.fireTickDamage = 1,
        this.thornsPercent = new Percentage(100),

        this.healthPercent = new Percentage(100),
        this.healthFlat = 20,
        this.healthFinal = 20,
        this.currentHealth = 20,
        this.healingRate = new Percentage(100),
        this.effHealingRate = new Percentage(100).toFixedPerc(2),
        this.regenPerSec = 0,
        this.regenPerSecPercent = new Percentage(0),
        this.lifeDrainOnCrit = 0,
        this.lifeDrainOnCritPercent = new Percentage(0),

        this.meleeProt = 0,
        this.projectileProt = 0,
        this.magicProt = 0,
        this.blastProt = 0,
        this.fireProt = 0,
        this.fallProt = 0,
        this.ailmentProt = 0,

        this.meleeFragility = 0,
        this.projectileFragility = 0,
        this.magicFragility = 0,
        this.blastFragility = 0,
        this.fireFragility = 0,

        this.meleeHNDR = new Percentage(0).toFixedPerc(2),
        this.projectileHNDR = new Percentage(0).toFixedPerc(2),
        this.magicHNDR = new Percentage(0).toFixedPerc(2),
        this.blastHNDR = new Percentage(0).toFixedPerc(2),
        this.fireHNDR = new Percentage(0).toFixedPerc(2),
        this.fallHNDR = new Percentage(0).toFixedPerc(2),
        this.ailmentHNDR = new Percentage(0).toFixedPerc(2),

        this.meleeDR = new Percentage(0).toFixedPerc(2),
        this.projectileDR = new Percentage(0).toFixedPerc(2),
        this.magicDR = new Percentage(0).toFixedPerc(2),
        this.blastDR = new Percentage(0).toFixedPerc(2),
        this.fireDR = new Percentage(0).toFixedPerc(2),
        this.fallDR = new Percentage(0).toFixedPerc(2),
        this.ailmentDR = new Percentage(0).toFixedPerc(2),

        this.meleeEHP = 0,
        this.projectileEHP = 0,
        this.magicEHP = 0,
        this.blastEHP = 0,
        this.fireEHP = 0,
        this.fallEHP = 0,
        this.ailmentEHP = 0,

        this.hasMoreArmor = false,
        this.hasMoreAgility = false,
        this.hasEqualDefenses = false,
        this.worldlyProtection = 0;

        this.attackDamagePercent = new Percentage(100),
        this.attackSpeedPercent = new Percentage(100),
        this.attackSpeed = 4,
        this.attackSpeedFlatBonus = 0,
        this.attackDamage = 1,
        this.attackDamageCrit = 1.5,
        this.iframeDPS = 2,
        this.iframeCritDPS = 3,

        this.projectileDamagePercent = new Percentage(100),
        this.projectileDamage = 0,
        this.projectileSpeedPercent = new Percentage(100),
        this.projectileSpeed = 0,
        this.throwRatePercent = new Percentage(100),
        this.throwRate = 0,

        this.magicDamagePercent = new Percentage(100),
        this.spellPowerPercent = new Percentage(100),
        this.spellDamage = new Percentage(100),
        this.spellCooldownPercent = new Percentage(100),
        this.divineJusticeDamage = 0,

        this.aptitude = 0,
        this.ineptitude = 0,
        this.crippling = 0,
        this.corruption = 0

        this.twoHanded = (this.itemStats.mainhand && this.itemStats.mainhand["two_handed"] == 1) ? true : false;
        this.weightless = (this.itemStats.offhand && this.itemStats.offhand["weightless"] == 1) ? true : false;
    }
}

module.exports = Stats;
