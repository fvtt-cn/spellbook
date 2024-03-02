import * as Utilities from '../utils.js'
// import * as SWPT from '../constants.js'
// import swpt from '../api.js'
import { SpellBook } from './spell-book.js';

const MODULE_ID = "spellbook";
export const PREPAR_SLOT_WIDTH = 450;
export class PreparSlot extends Application {
    constructor(actor, type) {
        super();
        this.#actor = actor;
        this.type = type == "" ? undefined : type;
        this.prefix = PreparSlot.APP_ID + (this.type ? "-" + this.type : "");
        let config = this.actor.getFlag(MODULE_ID, this.prefix + "-config") ?? game.settings.get(MODULE_ID, 'defaultSlotNum') ?? "0,3";
        let slotRing = config.split(",");
        if (slotRing.length >= 4) {
            this.width = 130 * slotRing.length;
        }
        // this.center = { x: this.width/2 - 30, y: this.width/2 - 45 };
        this.position.width = this.width;
        this.position.height = this.width + 30;

        this.updateActorHook = Hooks.on("updateActor", (actor, updates) => {
            if (actor.id === this.actor.id) this.render(true);
        });
    }

    #actor;
    width = PREPAR_SLOT_WIDTH;

    get actor() {
        return this.#actor;
    }

    get title() {
        return this.actor.name;
    }

    get width() {
        return this.width ?? PREPAR_SLOT_WIDTH;
    }

    static get APP_ID() {
        return "prepar-slot";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: this.APP_ID,
            template: `modules/${MODULE_ID}/templates/${this.APP_ID}.hbs`,
            popOut: true,
            resizable: true,
            minimizable: true,
            width: PREPAR_SLOT_WIDTH,
            height: PREPAR_SLOT_WIDTH + 30,
            classes: ["prepar-slot"],
            title: "法术准备槽位",
        });
    }

    get id() {
        return this.constructor.APP_ID + "-" + this.actor.uuid;
    }

    _onResize(event) {
        super._onResize(event);
        // Utilities.debug("_onResize", event, this);
        this.width = this.position.width;
        this.position.height = this.width + 30;
        // this.setPosition({height: this.width});
        this.render(true);
    }

    setPosition(...args) {
        super.setPosition(...args);
    }

    getSlots() {
        return foundry.utils.deepClone(this.actor.getFlag(MODULE_ID, this.prefix + "-slots") ?? {});
    }

    mapSlots(k) {
        // const slotName = game.settings.get(MODULE_ID, 'showSpellName') ? "prepar-slot-name" : "";
        return Object.entries(this.config.SLOTS[k]).map(([key, slots]) => {
            const slotData = [];
            for (let i = 0; i < slots.length; i++) {
                const itemUuid = this.slots[key]?.[i]?.id;
                const item = itemUuid ? fromUuidSync(itemUuid) : null;
                const itemColor = item ? Utilities.getItemColor(item) ?? "#00ffe7" : "#00ffe7";
                const slotLocked = this.slots[key]?.[i]?.slotLocked ?? false;
                const slotUseNum = this.slots[key]?.[i]?.slotUseNum ?? 1;
                const slotUseMax = this.slots[key]?.[i]?.slotUseMax ?? 1;
                const slotUseCur = this.slots[key]?.[i]?.slotUseCur ?? 1;
                const slotMark = this.slots[key]?.[i]?.slotMark ?? "";
                let deg = (360 / slots.length) * i + 180 * parseInt(key) + 90;
                //如果 slots.length 和 i 都是偶数
                if ((slots.length % 2 === 0) && (parseInt(key) % 2 === 0)) {
                    deg += 45;
                }
                let distance = ((this.width / 2) / this.config.SLOTS[k].length) * parseInt(key);
                let x = (this.width / 2 - 30) + distance * Math.cos(Math.toRadians(deg));
                let y = (this.width / 2 - 30) + distance * Math.sin(Math.toRadians(deg));
                slotData.push({
                    slotIndex: i,
                    slotId: key,
                    image: slots[i].img,
                    item,
                    itemColor,
                    x: x,
                    y: y,
                    empty: item ? "" : "prepar-slot-empty",
                    slotLocked: (slotLocked && this.limit.type == "施展锁定") ? "prepar-slot-locked" : "",
                    slotUseNum,
                    slotUseMax,
                    slotUseCur,
                    slotMark,
                    // slotName,
                    // showUsed: (this.limit.type == "可用次数" || this.limit.type == "总点数池") ? "true" : "",
                    // showPool: this.limit.type == "总点数池" ? "true" : "",
                });
            }
            return slotData;
        });
    }

    async getData() {
        // let prefix = PreparSlot.APP_ID + this.type;
        this.slots = this.getSlots();
        // this.config = {
        //     SLOTS: {
        //         PREPARED: [
        //             [
        //                 {
        //                     img: "icons/magic/symbols/circled-gem-pink.webp",
        //                 },
        //             ],
        //         ],
        //     }
        // };
        let config = this.actor.getFlag(MODULE_ID, this.prefix + "-config") ?? game.settings.get(MODULE_ID, 'defaultSlotNum') ?? "0,3";
        // this.numShow = this.actor.getFlag(MODULE_ID, this.prefix + "-numShow") ?? "隐藏";
        this.limit = this.actor.getFlag(MODULE_ID, this.prefix + "-limit") ?? { type: "无", target: "槽位", poolValue: 1, poolMax: 1 };
        let img = this.actor.getFlag(MODULE_ID, this.prefix + "-img") ?? { background: "modules/spellbook/img/spell-slot-background.png", slot: "icons/magic/symbols/circled-gem-pink.webp" };
        // this.config = { SLOTS: { PREPARED: Object.entries(config).map(([level, slots]) => Array(slots).fill({ img: img.slot })) } };
        this.config = { SLOTS: { PREPARED: config.split(",").map((slots) => Array(parseInt(slots)).fill({ img: img.slot })) } };
        const data = {
            prepared: this.mapSlots("PREPARED"),
            actor: this.actor,
            background: img.background,
            // slotImg: img.slot,
            limitLock: this.limit.type === "施展锁定" ? "true" : "",
            limitCount: this.limit.type === "可用次数" ? "true" : "",
            limitPool: this.limit.type === "总点数池" ? "true" : "",
            showName: game.settings.get(MODULE_ID, 'showSpellName'),
            showUsed: this.limit.type == "可用次数" || this.limit.type == "总点数池",
            // showPool: this.limit.type == "总点数池",
            pool: { value: this.limit.poolValue, max: this.limit.poolMax }
        };
        Utilities.debug("getData", data);
        return data;
    }

    async cast_spell(item, slot) {
        const currentFlag = this.getSlots();
        currentFlag[slot.slotId][slot.slotIndex] ??= {};
        if ((this.limit.type === "施展锁定") && (currentFlag[slot.slotId][slot.slotIndex]?.slotLocked ?? false)) {
            Utilities.notice('info', "法术已锁定，无法施展！");
            return;
        } else if ((this.limit.type === "可用次数") && (currentFlag[slot.slotId][slot.slotIndex]?.slotUseCur ?? 0) <= 0) {
            Utilities.notice('info', "法术次数已用完，无法施展！");
            return;
        } else if ((this.limit.type === "总点数池") && (this.limit.poolValue <= 0)) {
            Utilities.notice('info', "法术点数已用完，无法施展！");
            return;
        }

        // Utilities.debug("cast_spell", item, slot);
        //触发施展法术的钩子，你可以在你的模块中监听这个钩子
        Hooks.call("preparSlotCastSpell", this.actor, item, slot);

        //系统耦合
        if (game.system.id === "swade") {
            if (item.type === "power" && item.parent == this.actor) {
                await item.roll();
            }
        } else if (game.system.id === "dnd5e") {
            if (item.type === "spell" && item.parent == this.actor) {
                await item.use();
            }
        } else if (game.system.id === "D35E") {
            if (item.type === "spell" && item.parent == this.actor) {
                await item.roll();
            }
        } else {
            if (item.use && item.parent == this.actor) {
                await item.use();
            } else if (item.roll && item.parent == this.actor) {
                await item.roll();
            }
        }

        if (this.limit.type === "施展锁定") {
            currentFlag[slot.slotId][slot.slotIndex].slotLocked = true;
        } else if (this.limit.type === "可用次数") {
            currentFlag[slot.slotId][slot.slotIndex].slotUseCur = currentFlag[slot.slotId][slot.slotIndex].slotUseCur - 1;
        } else if (this.limit.type === "总点数池") {
            this.limit.poolValue = this.limit.poolValue - (currentFlag[slot.slotId][slot.slotIndex].slotUseNum ?? 1);
        }
        if (this.limit.type === "施展锁定" || this.limit.type === "可用次数") {
            await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
        } else if (this.limit.type === "总点数池") {
            await this.actor.setFlag(MODULE_ID, this.prefix + "-limit", this.limit);
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        html = html[0] ?? html;

        html.querySelectorAll(".prepar-slot-slot").forEach((slot) => {
            slot.addEventListener("dragstart", this._onDragStart.bind(this));
            slot.addEventListener("dragend", this._onDragEnd.bind(this));
            slot.addEventListener("drop", this._onDrop.bind(this));
            slot.addEventListener("contextmenu", this._onContextMenu.bind(this));
            // slot.addEventListener("click", this._onClick.bind(this));
            slot.addEventListener("dblclick", this._onDblClick.bind(this));
        });
        html.querySelectorAll(".prepar-slot-pool").forEach((slot) => {
            slot.addEventListener("contextmenu", this.modifyPool.bind(this));
        });
    }

    async modifyPool(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.limit.type !== "总点数池") return;
        if (event.altKey) {
            let results = await warpgate.menu({
                inputs: [
                    { type: 'number', label: '当前点数：', options: this.limit.poolValue },
                ],
                buttons: [
                    { label: '确定', value: "OK" },
                    { label: '+1', value: "+1" },
                    { label: '-1', value: "-1" },
                    { label: '取消', value: "cancel" }
                ]
            }, {
                title: '总点数池配置'
            });

            if (results.buttons === "OK") {
                this.limit.poolValue = results.inputs[0];
            } else if (results.buttons === "+1") {
                this.limit.poolValue = this.limit.poolValue + 1;
            } else if (results.buttons === "-1") {
                this.limit.poolValue = this.limit.poolValue - 1;
            }
            await this.actor.setFlag(MODULE_ID, this.prefix + "-limit", this.limit);
        } else if (event.ctrlKey) {
            let results = await warpgate.menu({
                inputs: [
                    { type: 'number', label: '最大点数：', options: this.limit.poolMax },
                ],
                buttons: [
                    { label: '确定', value: "OK" },
                    { label: '+1', value: "+1" },
                    { label: '-1', value: "-1" },
                    { label: '取消', value: "cancel" }
                ]
            }, {
                title: '总点数池配置'
            });

            if (results.buttons === "OK") {
                this.limit.poolMax = results.inputs[0];
            } else if (results.buttons === "+1") {
                this.limit.poolMax = this.limit.poolMax + 1;
            } else if (results.buttons === "-1") {
                this.limit.poolMax = this.limit.poolMax - 1;
            }
            await this.actor.setFlag(MODULE_ID, this.prefix + "-limit", this.limit);
        }
    }

    async _onDblClick(event) {
        event.stopPropagation();
        const slotIndex = event.currentTarget.dataset.index;
        const slotId = event.currentTarget.dataset.id;
        const itemUuid = this.slots[slotId]?.[slotIndex]?.id;
        const item = itemUuid ? fromUuidSync(itemUuid) : null;
        if (!item) return;
        this.cast_spell(item, { slotId, slotIndex });
    }

    // _onClick(event) {
    //     event.stopPropagation();
    //     const slotIndex = event.currentTarget.dataset.index;
    //     const slotId = event.currentTarget.dataset.id;
    //     const itemUuid = this.slots[slotId]?.[slotIndex]?.id;
    //     const item = itemUuid ? fromUuidSync(itemUuid) : null;
    //     if (!item) return;
    //     item.sheet.render(true);
    // }

    async _onContextMenu(event) {
        // Utilities.debug("_onContextMenu", event, event.altKey);
        event.preventDefault();
        event.stopPropagation();
        const slotIndex = event.currentTarget.dataset.index;
        const slotId = event.currentTarget.dataset.id;
        const currentFlag = this.getSlots();
        currentFlag[slotId] ??= {};
        currentFlag[slotId][slotIndex] ??= {};
        if (event.altKey) {
            //lock/unlock slot
            if (this.limit.type === "施展锁定") {
                currentFlag[slotId][slotIndex].slotLocked = currentFlag[slotId][slotIndex]?.slotLocked ? false : true;
            } else if (this.limit.type === "可用次数") {
                //弹出对话框
                let results = await warpgate.menu({
                    inputs: [
                        { type: 'number', label: '当前次数：', options: currentFlag[slotId][slotIndex]?.slotUseCur ?? 1 },
                    ],
                    buttons: [
                        { label: '确定', value: "OK" },
                        { label: '+1', value: "+1" },
                        { label: '-1', value: "-1" },
                        { label: '取消', value: "cancel" }
                    ]
                }, {
                    title: '可用次数配置'
                });

                if (results.buttons === "OK") {
                    currentFlag[slotId][slotIndex].slotUseCur = results.inputs[0];
                } else if (results.buttons === "+1") {
                    currentFlag[slotId][slotIndex].slotUseCur = (currentFlag[slotId][slotIndex]?.slotUseCur ?? 1) + 1;
                } else if (results.buttons === "-1") {
                    currentFlag[slotId][slotIndex].slotUseCur = (currentFlag[slotId][slotIndex]?.slotUseCur ?? 1) - 1;
                }
            }
            await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
        } else if (event.ctrlKey) {
            if (this.limit.type === "可用次数") {
                //弹出对话框
                let results = await warpgate.menu({
                    inputs: [
                        { type: 'number', label: '最大次数：', options: currentFlag[slotId][slotIndex]?.slotUseMax ?? 1 },
                    ],
                    buttons: [
                        { label: '确定', value: "OK" },
                        { label: '+1', value: "+1" },
                        { label: '-1', value: "-1" },
                        { label: '取消', value: "cancel" }
                    ]
                }, {
                    title: '可用次数配置'
                });

                if (results.buttons === "OK") {
                    currentFlag[slotId][slotIndex].slotUseMax = results.inputs[0];
                } else if (results.buttons === "+1") {
                    currentFlag[slotId][slotIndex].slotUseMax = (currentFlag[slotId][slotIndex]?.slotUseMax ?? 1) + 1;
                } else if (results.buttons === "-1") {
                    currentFlag[slotId][slotIndex].slotUseMax = (currentFlag[slotId][slotIndex]?.slotUseMax ?? 1) - 1;
                }
            } else if (this.limit.type === "总点数池") {
                //弹出对话框
                let results = await warpgate.menu({
                    inputs: [
                        { type: 'number', label: '消耗点数：', options: currentFlag[slotId][slotIndex]?.slotUseNum ?? 1 },
                    ],
                    buttons: [
                        { label: '确定', value: "OK" },
                        { label: '+1', value: "+1" },
                        { label: '-1', value: "-1" },
                        { label: '取消', value: "cancel" }
                    ]
                }, {
                    title: '总点数池配置'
                });

                if (results.buttons === "OK") {
                    currentFlag[slotId][slotIndex].slotUseNum = results.inputs[0];
                } else if (results.buttons === "+1") {
                    currentFlag[slotId][slotIndex].slotUseNum = (currentFlag[slotId][slotIndex]?.slotUseNum ?? 1) + 1;
                } else if (results.buttons === "-1") {
                    currentFlag[slotId][slotIndex].slotUseNum = (currentFlag[slotId][slotIndex]?.slotUseNum ?? 1) - 1;
                }
            }
            await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
            // if (this.limit.type === "可用次数") {
            //     await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
            // } else if (this.limit.type === "总点数池") {
            //     await this.actor.setFlag(MODULE_ID, this.prefix + "-limit", this.limit);
            // }
        } else if (event.shiftKey) {
            //修改槽位标记
            //弹出对话框
            let results = await warpgate.menu({
                inputs: [
                    { type: 'text', label: '槽位标记：', options: currentFlag[slotId][slotIndex]?.slotMark ?? "" },
                ],
                buttons: [
                    { label: '确定', value: "OK" },
                    { label: '取消', value: "cancel" }
                ]
            }, {
                title: '槽位标记配置'
            });

            if (results.buttons === "OK") {
                Utilities.debug("slotMark", results.inputs[0], currentFlag[slotId][slotIndex]?.slotMark, currentFlag[slotId][slotIndex], currentFlag);
                currentFlag[slotId][slotIndex].slotMark = results.inputs[0];
                await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
            }
        } else {
            //open sheet
            const itemUuid = this.slots[slotId]?.[slotIndex]?.id;
            const item = itemUuid ? fromUuidSync(itemUuid) : null;
            if (!item) return;
            item.sheet.render(true);
        }
    }

    _onDragStart(event) {
        event.stopPropagation();
        const slotIndex = event.currentTarget.dataset.index;
        const slotId = event.currentTarget.dataset.id;
        event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
                eslotIndex: slotIndex,
                eslotId: slotId,
                type: "Item",
                uuid: this.slots[slotId]?.[slotIndex]?.id,
                fromPanel: PreparSlot.APP_ID,
                fromUuid: this.actor.uuid,
                panelType: this.type,
            }),
        );
        // Utilities.debug("_onDragStart", event, event.currentTarget.dataset, JSON.parse(event.dataTransfer.getData("text/plain")));
    }

    dropOccurred = false;

    async _onDragEnd(event) {
        //delete item
        event.stopPropagation();
        if (!this.dropOccurred) {
            const slotIndex = event.currentTarget.dataset.index;
            const slotId = event.currentTarget.dataset.id;
            let confirm = await Utilities.choose({ label: "是否移除？", options: ["是", "否"], info: "如果选择是，法术将从准备槽移除", title: "移除法术" });
            if (confirm == "是") {
                const currentFlag = this.getSlots();
                currentFlag[slotId] ??= {};
                const currentFlagItem = currentFlag[slotId][slotIndex]?.id;
                currentFlag[slotId][slotIndex] ??= {};
                currentFlag[slotId][slotIndex].id = null;
                if (this.limit.target === "法术") {
                    currentFlag[slotId][slotIndex].slotLocked = undefined;
                    currentFlag[slotId][slotIndex].slotUseNum = undefined;
                    currentFlag[slotId][slotIndex].slotUseMax = undefined;
                    currentFlag[slotId][slotIndex].slotUseCur = undefined;
                }
                await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
            }
        }
        // Utilities.debug("_onDragEnd", event, event.currentTarget.dataset, this.dropOccurred);
        this.dropOccurred = false;
    }

    async _onDrop(event) {
        event.stopPropagation();
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (e) {
            return;
        }

        const slotIndex = event.currentTarget.dataset.index;
        const slotId = event.currentTarget.dataset.id;
        const currentItem = this.slots[slotId]?.[slotIndex]?.id;

        const draggedId = data.eslotId;
        const draggedIndex = data.eslotIndex;
        const fromPanel = data.fromPanel;
        const fromItemUuid = data.fromUuid;
        const panelType = data.panelType;
        let item = await fromUuid(data.uuid);

        Utilities.debug("_onDrop", event, data, item, this.actor, item.type, (item.type != "power" && item.type != "spell" && item.type != game.settings.get(MODULE_ID, 'spellItemType')));
        if (item.type != "power" && item.type != "spell" && item.type != game.settings.get(MODULE_ID, 'spellItemType')) {
            return;
        }

        Utilities.debug("_onDrop", (game.settings.get(MODULE_ID, 'autoAddSpell') && item.parent != this.actor), item.clone);
        if (game.settings.get(MODULE_ID, 'autoAddSpell') && item.parent != this.actor) {
            if (game.settings.get(MODULE_ID, 'detectSameName')) {
                let sameName = this.actor.items.find((i) => i.name === item.name);
                if (sameName) {
                    item = sameName;
                } else {
                    item = await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
                    item = item[0];
                }
            } else {
                item = await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
                item = item[0];
            }
        }
        Utilities.debug("_onDrop", item, item.type, item.parent, this.actor);

        const swapItems = draggedId !== undefined && draggedIndex !== undefined;
        const currentFlag = this.getSlots();
        currentFlag[slotId] ??= {};
        currentFlag[slotId][slotIndex] ??= {};

        if (swapItems) {
            // this.dropOccurred = true;
            // Utilities.debug("swapItems", fromPanel, this.APP_ID);
            if (fromPanel == PreparSlot.APP_ID && fromItemUuid == this.actor.uuid && this.type == panelType) {
                this.dropOccurred = true;
                currentFlag[draggedId][draggedIndex].id = currentItem ?? null;
                if (this.limit.target === "法术") {
                    let swapTemp = {
                        slotLocked: currentFlag[draggedId][draggedIndex]?.slotLocked,
                        slotUseNum: currentFlag[draggedId][draggedIndex]?.slotUseNum,
                        slotUseMax: currentFlag[draggedId][draggedIndex]?.slotUseMax,
                        slotUseCur: currentFlag[draggedId][draggedIndex]?.slotUseCur,
                        slotMark: currentFlag[draggedId][draggedIndex]?.slotMark,
                    };
                    currentFlag[draggedId][draggedIndex].slotLocked = currentFlag[slotId][slotIndex]?.slotLocked;
                    currentFlag[draggedId][draggedIndex].slotUseNum = currentFlag[slotId][slotIndex]?.slotUseNum;
                    currentFlag[draggedId][draggedIndex].slotUseMax = currentFlag[slotId][slotIndex]?.slotUseMax;
                    currentFlag[draggedId][draggedIndex].slotUseCur = currentFlag[slotId][slotIndex]?.slotUseCur;
                    currentFlag[draggedId][draggedIndex].slotMark = currentFlag[slotId][slotIndex]?.slotMark;
                    currentFlag[slotId][slotIndex].slotLocked = swapTemp.slotLocked;
                    currentFlag[slotId][slotIndex].slotUseNum = swapTemp.slotUseNum;
                    currentFlag[slotId][slotIndex].slotUseMax = swapTemp.slotUseMax;
                    currentFlag[slotId][slotIndex].slotUseCur = swapTemp.slotUseCur;
                    currentFlag[slotId][slotIndex].slotMark = swapTemp.slotMark;
                    // delete swapTemp;
                }
            } else if (fromPanel == SpellBook.APP_ID) {
                const openWindow = Object.values(ui.windows).find((w) => (w instanceof SpellBook) && w?.item?.uuid == fromUuid);
                if (openWindow) {
                    openWindow.dropOccurred = true;
                }
            } else if (fromPanel == PreparSlot.APP_ID && fromItemUuid != this.actor.uuid) {
                Utilities.notice('error', "请不要将其他角色的法术拖动至此！");
                return;
            } else if (fromPanel == PreparSlot.APP_ID && fromItemUuid == this.actor.uuid && this.type != panelType) {
                Utilities.notice('error', "请不要在不同类型的法术槽之间拖动！");
                return;
            }
        } else if (this.limit.target === "法术") {
            if (currentFlag[slotId][slotIndex]?.slotLocked !== undefined) {
                currentFlag[slotId][slotIndex].slotLocked = false;
            }
            if (currentFlag[slotId][slotIndex]?.slotUseNum !== undefined) {
                currentFlag[slotId][slotIndex].slotUseNum = 1;
            }
            if (currentFlag[slotId][slotIndex]?.slotUseMax !== undefined) {
                currentFlag[slotId][slotIndex].slotUseMax = 1;
            }
            if (currentFlag[slotId][slotIndex]?.slotUseCur !== undefined) {
                currentFlag[slotId][slotIndex].slotUseCur = 1;
            }
            if (currentFlag[slotId][slotIndex]?.slotMark !== undefined) {
                currentFlag[slotId][slotIndex].slotMark = "";
            }
        }

        currentFlag[slotId][slotIndex].id = item.uuid;

        await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
        // Utilities.debug("_onDrop", event, event.currentTarget.dataset, data, this.dropOccurred);
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (game.user.isGM || game.settings.get(MODULE_ID, 'allowUserConfig')) {
            buttons.unshift({
                class: "prepar-slot-actor-config",
                icon: "fas fa-cog",
                onclick: () => {
                    this.configure();
                },
                label: "配置",
            });
        }
        if (this.limit.type != "无") {
            buttons.unshift({
                class: "prepar-slot-actor-refresh",
                icon: "fa-solid fa-arrows-rotate",
                onclick: () => {
                    this.refreshSlot();
                },
                label: "刷新准备槽",
            });
        }
        return buttons;
    }

    async refreshSlot() {
        if (this.limit.type === "施展锁定" || this.limit.type === "可用次数") {
            const currentFlag = this.getSlots();
            // Utilities.debug("refreshSlot", currentFlag);
            Object.entries(currentFlag).map(([key, slots]) => {
                Object.entries(slots).map(([key2, slot]) => {
                    if ((this.limit.type === "施展锁定") && (currentFlag[key][key2]?.slotLocked ?? false)) {
                        currentFlag[key][key2].slotLocked = false;
                    } else if ((this.limit.type === "可用次数")) {
                        currentFlag[key][key2].slotUseCur = currentFlag[key][key2].slotUseMax;
                    }
                });
            });
            await this.actor.setFlag(MODULE_ID, this.prefix + "-slots", currentFlag);
        } else if (this.limit.type === "总点数池") {
            this.limit.poolValue = this.limit.poolMax;
            await this.actor.setFlag(MODULE_ID, this.prefix + "-limit", this.limit);
        }
    }

    async configure() {
        //如果非GM且不允许非GM用户配置，则返回
        if (!game.user.isGM && !game.settings.get(MODULE_ID, 'allowUserConfig')) return;

        //配置准备槽位的环数和每个环的槽位数量
        //配置背景图像和槽位图标
        //配置限制方式和限制对象

        //获取现有配置
        // let prefix = PreparSlot.APP_ID + this.type;
        // let config = this.actor.getFlag(MODULE_ID, this.prefix + "-config") ?? [0, 3];
        let img = this.actor.getFlag(MODULE_ID, this.prefix + "-img") ?? { background: "modules/spellbook/img/spell-slot-background.png", slot: "icons/magic/symbols/circled-gem-pink.webp" };
        // let text = config.map((slots) => `${slots}`).join(",");
        let config = this.actor.getFlag(MODULE_ID, this.prefix + "-config") ?? game.settings.get(MODULE_ID, 'defaultSlotNum') ?? "0,3";
        let limit = this.actor.getFlag(MODULE_ID, this.prefix + "-limit") ?? { type: "无", target: "槽位", poolValue: 1, poolMax: 1 };
        // let numShow = this.actor.getFlag(MODULE_ID, this.prefix + "-numShow") ?? "隐藏";
        const limitType = ["无", "施展锁定", "可用次数", "总点数池"].map((item) => {
            return { html: item, value: item, selected: limit.type === item }
        });
        const limitTarget = ["槽位", "法术"].map((item) => {
            return { html: item, value: item, selected: limit.target === item }
        });
        // const slotNumShow = ["隐藏", "显示"].map((item) => {
        //     return { html: item, value: item, selected: numShow === item }
        // });

        //弹出对话框
        let results = await warpgate.menu({
            inputs: [
                { type: 'text', label: '槽位配置：', options: config },
                { type: 'text', label: '背景图像：', options: img.background },
                { type: 'text', label: '槽位图标：', options: img.slot },
                // { type: 'select', label: '序号显示：', options: slotNumShow },
                { type: 'select', label: '限制方式：', options: limitType },
                { type: 'select', label: '限制对象：', options: limitTarget },
                { type: 'info', label: "<p>槽位配置的格式为以逗号分隔的槽位数量，。前方的为中心，后方的为外环。请注意，最中心的只能有一个槽位有效。</p><p>序号显示的是槽位环的序号，中心为0，可按shift+右键点击槽位进行配置。</p>" }
            ],
            buttons: [
                { label: '确定', value: "OK" },
                { label: '取消', value: "cancel" }
            ]
        }, {
            title: '准备槽位配置'
        });

        //更新配置
        if (results.buttons === "OK") {
            // let newConfig = [];
            // results.inputs[0].split(",").forEach((item) => {
            //     let [level, slots] = item.split(":");
            //     level = parseInt(level) ?? 0;
            //     newConfig[level] = parseInt(slots) ?? 1;
            // });
            let prefix = "flags." + MODULE_ID + "." + this.prefix;
            // let newConfig = results.inputs[0].split(",").map((item) => parseInt(item) ?? 1);
            // if (newConfig[0] > 1) newConfig = 1;
            if (results.inputs[0][0] > 1) {
                results.inputs[0] = "1" + results.inputs[0].slice(1);
            }
            // await this.actor.setFlag(MODULE_ID, "prepar-slots-config", newConfig);
            // await this.actor.setFlag(MODULE_ID, "prepar-slots-img", { background: results.inputs[1], slot: results.inputs[2]});
            // let updates = { "flags.spellbook.prepar-slots-config": newConfig, "flags.spellbook.prepar-slots-img": { background: results.inputs[1], slot: results.inputs[2] } };
            let updates = {};
            updates[prefix + "-config"] = results.inputs[0];
            updates[prefix + "-img"] = { background: results.inputs[1], slot: results.inputs[2] };
            updates[prefix + "-limit"] = { type: results.inputs[3], target: results.inputs[4], poolValue: limit.poolValue, poolMax: limit.poolMax };
            // updates[prefix + "-numShow"] = results.inputs[3];
            await this.actor.update(updates);
        }
    }

    async _renderOuter(...args) {
        const html = await super._renderOuter(...args);
        return html;
    }

    async close(...args) {
        super.close(...args);
        Hooks.off("updateActor", this.updateActorHook);
    }

    static toggle() {
        const openWindow = Object.values(ui.windows).find((w) => w instanceof PreparSlot);
        if (openWindow) openWindow.close();
        else {
            const actor = ui.activeWindow.object instanceof Actor ? ui.activeWindow.object : game.user.character;
            if (actor) new PreparSlot(actor).render(true);
        }
    }
}
