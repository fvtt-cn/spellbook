import * as Utilities from '../utils.js'
// import * as SWPT from '../constants.js'
// import swpt from '../api.js'

const MODULE_ID = "spellbook";
export const SPELL_BOOK_WIDTH = 450;
export const SPELL_BOOK_HEIGHT = 330;
export const SPELL_BOOK_SLOT = 24;

export class SpellBook extends Application {
    constructor(item) {
        super();
        this.#item = item;
        // let config = this.item.getFlag(MODULE_ID, "slots-config") ?? [1];
        // this.center = { x: this.width/2 - 30, y: this.width/2 - 45 };
        // this.position.width = this.position.height = this.width;

        this.updateItemHook = Hooks.on("updateItem", (item, updates) => {
            if (item.id === this.item.id) this.render(true);
        });
    }

    #item;

    get item() {
        return this.#item;
    }

    get title() {
        return this.item.name;
    }

    static get APP_ID() {
        return "spell-book";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: this.APP_ID,
            template: `modules/${MODULE_ID}/templates/${this.APP_ID}.hbs`,
            popOut: true,
            resizable: false,
            minimizable: true,
            width: SPELL_BOOK_WIDTH,
            height: SPELL_BOOK_HEIGHT,
            classes: ["spell-book"],
            title: "法术书",
        });
    }

    get id() {
        return this.constructor.APP_ID + "-" + this.item.uuid;
    }

    _onResize(event) {
        super._onResize(event);
    }

    setPosition(...args) {
        super.setPosition(...args);
    }

    getSlots() {
        return foundry.utils.deepClone(this.item.getFlag(MODULE_ID, SpellBook.APP_ID + "-slots") ?? {});
    }

    mapSlots(k) {
        // const slotName = game.settings.get(MODULE_ID, 'showSpellName') ? "spell-book-name" : "";
        return Object.entries(this.config.SLOTS[k]).map(([key, slots]) => {
            const slotData = [];
            for (let i = 0; i < slots.length; i++) {
                const page = (key * 2) + (k == "LEFT" ? 0 : 1);
                const itemUuid = this.slots[page]?.[i]?.id;
                const item = itemUuid ? fromUuidSync(itemUuid) : null;
                const itemColor = item ? Utilities.getItemColor(item) ?? "" : "";

                slotData.push({
                    slotIndex: i,
                    slotId: page,
                    image: slots[i].img,
                    item,
                    itemColor,
                    // slotName,
                    empty: item ? "" : "spell-book-empty",
                    current: ((k == "LEFT" && page == this.pageNum.current - 1) || (k == "RIGHT" && page == this.pageNum.current)) ? "spell-book-current-page" : "",
                });
            }
            return slotData;
        });
    }

    async getData() {
        this.slots = this.getSlots();
        // this.config = {
        //     SLOTS: {
        //         RECORDED: [
        //             [
        //                 {
        //                     img: "icons/sundries/documents/document-symbol-rune-tan.webp",
        //                 },
        //             ],
        //         ],
        //     }
        // };
        this.pageNum = this.item.getFlag(MODULE_ID, "spell-book-page") ?? { current: 1, max: 2 };
        let img = this.item.getFlag(MODULE_ID, "spell-book-img") ?? { background: "modules/spellbook/img/spell-book.png", slot: "icons/sundries/documents/document-symbol-rune-tan.webp" };
        this.config = { SLOTS: { LEFT: Array(Math.ceil(this.pageNum.max / 2)).fill(Array(6).fill({ img: img.slot })), RIGHT: Array(Math.floor(this.pageNum.max / 2)).fill(Array(6).fill({ img: img.slot })) } };
        const data = {
            left: this.mapSlots("LEFT"),
            right: this.mapSlots("RIGHT"),
            item: this.item,
            background: img.background,
            currentPage: this.pageNum.current,
            showName: game.settings.get(MODULE_ID, 'showSpellName'),
        };
        Utilities.debug("getData", data);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html = html[0] ?? html;

        html.querySelectorAll(".spell-book-slot").forEach((slot) => {
            slot.addEventListener("dragstart", this._onDragStart.bind(this));
            slot.addEventListener("dragend", this._onDragEnd.bind(this));
            slot.addEventListener("drop", this._onDrop.bind(this));
            slot.addEventListener("contextmenu", this._onContextMenu.bind(this));
            // slot.addEventListener("click", this._onClick.bind(this));
            // slot.addEventListener("dblclick", this._onDblClick.bind(this));
        });

        html.querySelector(".spell-book-foreground").addEventListener("dblclick", this._onDblClick.bind(this));
    }

    async _onDblClick(event) {
        event.stopPropagation();
        //点击页面侧边翻页
        Utilities.debug("_onDblClick", event, event.target.className);
        if (event.layerX < 60 && (event?.target?.className?.includes("spell-book-foreground") || event?.target?.parentNode?.className?.includes("spell-book-foreground"))) {
            //向前翻页
            if (this.pageNum.current >= 3) {
                this.item.setFlag(MODULE_ID, "spell-book-page", { current: this.pageNum.current - 2 });
            } else {
                Utilities.notice('info', "已经是第一页");
            }
        } else if (event.layerX > 390 && (event?.target?.className?.includes("spell-book-foreground") || event?.target?.parentNode?.className?.includes("spell-book-foreground"))) {
            //向后翻页
            if (this.pageNum.current <= this.pageNum.max - 2) {
                this.item.setFlag(MODULE_ID, "spell-book-page", { current: this.pageNum.current + 2 });
            } else {
                Utilities.notice('info', "已经是最后一页");
            }
        }
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
        //open sheet
        event.preventDefault();
        event.stopPropagation();
        const slotIndex = event.currentTarget.dataset.index;
        const slotId = event.currentTarget.dataset.id;
        const itemUuid = this.slots[slotId]?.[slotIndex]?.id;
        const item = itemUuid ? fromUuidSync(itemUuid) : null;
        if (!item) return;
        item.sheet.render(true);
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
                fromPanel: SpellBook.APP_ID,
                fromUuid: this.item.uuid
            }),
        );
        Utilities.debug("_onDragStart", event, event.currentTarget.dataset, JSON.parse(event.dataTransfer.getData("text/plain")));
    }

    dropOccurred = false;

    async _onDragEnd(event) {
        //delete item
        event.stopPropagation();
        if (!this.dropOccurred) {
            // Utilities.debug("_onDragEnd", event.currentTarget.dataset, event);
            const slotIndex = event.currentTarget.dataset.index;
            const slotId = event.currentTarget.dataset.id;
            let confirm = await Utilities.choose({ label: "是否移除？", options: ["是", "否"], info: "如果选择是，法术将从法术书移除", title: "移除法术" });
            if (confirm == "是") {
                // Utilities.debug("_onDragEnd", event.currentTarget.dataset, event);
                const currentFlag = this.getSlots();
                currentFlag[slotId] ??= {};
                const currentFlagItem = currentFlag[slotId][slotIndex]?.id;
                currentFlag[slotId][slotIndex] ??= {};
                currentFlag[slotId][slotIndex].id = null;
                await this.item.setFlag(MODULE_ID, SpellBook.APP_ID + "-slots", currentFlag);
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
        const item = await fromUuid(data.uuid);

        // if (item.type != "power") {
        //     return;
        // }

        const swapItems = draggedId !== undefined && draggedIndex !== undefined;

        if (!(swapItems && fromPanel == SpellBook.APP_ID && fromItemUuid == this.item.uuid)) {
            let confirm = await Utilities.choose({ label: "是否将法术抄录进法术书？", options: ["是", "否"], info: "如果选择是，法术被抄录进法术书", title: "抄录法术" });
            if (confirm != "是") return;
        }

        const currentFlag = this.getSlots();
        currentFlag[slotId] ??= {};
        currentFlag[slotId][slotIndex] ??= {};

        if (swapItems) {
            // this.dropOccurred = true;
            // Utilities.debug("swapItems", fromPanel, this.APP_ID);
            if (fromPanel == SpellBook.APP_ID && fromItemUuid == this.item.uuid) {
                this.dropOccurred = true;
                currentFlag[draggedId][draggedIndex].id = currentItem ?? null;
            }
        }

        currentFlag[slotId][slotIndex].id = item.uuid;

        await this.item.setFlag(MODULE_ID, SpellBook.APP_ID + "-slots", currentFlag);
        // Utilities.debug("_onDrop", event, event.currentTarget.dataset, data, this.dropOccurred);
    }

    // _getHeaderButtons() {
    //     let buttons = super._getHeaderButtons();
    //     buttons.unshift({
    //         class: "spell-book-item-config",
    //         icon: "fas fa-cog",
    //         onclick: () => {
    //             this.configure();
    //         },
    //         label: "配置",
    //     });
    //     buttons.unshift({
    //         class: "spell-book-item-refresh",
    //         icon: "fas fa-suitcase",
    //         onclick: () => {
    //             this.item.sheet.render();
    //         },
    //         label: "打开物品界面",
    //     });
    //     return buttons;
    // }

    async _renderOuter(...args) {
        const html = await super._renderOuter(...args);
        return html;
    }

    async close(...args) {
        super.close(...args);
        Hooks.off("updateItem", this.updateItemHook);
    }

    static toggle() {
        const openWindow = Object.values(ui.windows).find((w) => w instanceof SpellBook);
        if (openWindow) openWindow.close();
        else {
            const item = ui.activeWindow.object instanceof Item ? ui.activeWindow.object : undefined;
            if (item) new SpellBook(item).render(true);
        }
    }
}