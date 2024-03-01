/* globals game, FormApplication, $ */

// import * as CONST from './constants.js'
const MODULE_ID = 'spellbook';

// export const settingVariables = [
    
// ];

export function register_settings() {
    game.settings.register(MODULE_ID, 'allowUserConfig', {
        name: "允许非GM用户配置",
        hint: "允许非GM用户打开和编辑角色和物品的spellbook设置",
        type: Boolean,
        default: true,
        scope: 'world',
        config: true,
    });
    game.settings.register(MODULE_ID, 'showActorButton', {
        name: "显示角色卡顶部按钮",
        hint: "显示角色卡顶部按钮，点击后打开角色卡的准备槽",
        type: Boolean,
        default: true,
        scope: 'world',
        config: true,
    });
    game.settings.register(MODULE_ID, 'defaultType', {
        name: "默认准备槽类型",
        hint: "默认准备槽类型，当点击角色卡按钮打开角色卡时使用此值",
        type: String,
        default: "",
        scope: 'world',
        config: true,
    });
    game.settings.register(MODULE_ID, 'defaultSlotNum', {
        name: "默认准备槽数量",
        hint: "默认准备槽数量，当角色没有配置准备槽数量时初次打开准备槽时使用此值，以逗号分隔，第一个数只能是0或1",
        type: String,
        default: "0,3",
        scope: 'world',
        config: true,
    });
    game.settings.register(MODULE_ID, 'showItemButton', {
        name: "显示物品卡顶部按钮",
        hint: "显示物品卡顶部按钮，点击后打开法术书配置",
        type: Boolean,
        default: true,
        scope: 'world',
        config: true,
    });

    game.settings.register(MODULE_ID, 'debug', {
        name: "是否开启debug模式",
        hint: "是否开启debug模式，开启后会在控制台输出debug信息",
        type: Boolean,
        default: false,
        scope: 'world',
        config: true,
    });
    // game.settings.registerMenu(MODULE_ID, 'custom-config', {
    //     name: "法术书 配置菜单",
    //     label: "配置菜单",
    //     icon: 'fa-solid fa-hand-sparkles',
    //     hint: "点击配置spellbook的所有设置",
    //     type: CustomConfigForm
    // });
    // for (let setting of settingVariables) {
    //     game.settings.register('spellbook', setting.id, {
    //         name: setting.name,
    //         hint: setting.hint,
    //         type: setting.config_type,
    //         default: setting.default,
    //         scope: 'world',
    //         config: false
    //     });
    // }
}

// class CustomConfigForm extends FormApplication {
//     static get defaultOptions() {
//         let options = super.defaultOptions;
//         options.id = 'spellbook-custom-config';
//         options.template = "/modules/spellbook/templates/customConfig.hbs";
//         options.width = CONST.CONFIG_WINDOW_WIDTH;
//         options.height = CONST.CONFIG_WINDOW_HEIGHT;
//         return options;
//     }

//     activateListeners(html) {
//         html.find('.spellbook-tab-header').on('click', this.change_tab);
//         return super.activateListeners(html);
//     }

//     change_tab(event) {
//         const tab_name = event.currentTarget.dataset.tab;
//         $('.spellbook-tab').each((_, tab) => {
//             if (tab.dataset.tab === tab_name) {
//                 $(tab).addClass('active');
//             } else {
//                 $(tab).removeClass('active');
//             }
//         });
//     }

//     getData() {
//         let tabs = {};
//         for (let setting of settingVariables) {
//             if (!tabs.hasOwnProperty(setting.tab)) {
//                 tabs[setting.tab] = [];
//             }
//             tabs[setting.tab].push(
//                 {
//                     id: setting.id,
//                     is_boolean: setting.config_type === Boolean,
//                     is_numeric: setting.config_type === Number,
//                     options: setting.options ? setting.options : "",
//                     min: setting.min,
//                     max: setting.max,
//                     step: setting.step,
//                     value: game.settings.get('spellbook', setting.id),
//                     name: setting.name,
//                     hint: setting.hint
//                 });
//         }
//         return { tabs: tabs };
//     }

//     async _updateObject(_, formData) {
//         for (let id in formData) {
//             if (formData[id]) {
//                 await game.settings.set('spellbook', id, formData[id]);
//             } else {
//                 await game.settings.set('spellbook', id, '');
//             }
//         }
//         window.location.reload();
//     }
// }
