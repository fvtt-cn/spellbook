const MODULE_ID = 'spellbook';

import * as Utilities from './utils.js';
import { register_settings } from './settings.js';

Hooks.once('init', function () {
    game.modules.get(MODULE_ID).api = Utilities; // 之后可被如此调用: const spellbook = game.modules.get('spellbook')?.api;
    // game.modules.get(moduleName).const = {  };
    // SpellBookToolBar.init();
});

// Hooks.once("socketlib.ready", () => {
//     SpellBookSocket.initialize();
// });

Hooks.on('ready', () => {
    register_settings();
});

Hooks.on('getItemSheetHeaderButtons', (sheet, buttons) => {
    if (game.settings.get(MODULE_ID, 'showItemButton') ?? false) {
        buttons.unshift({
            class: MODULE_ID + '-item-config',
            label: '法术书',
            icon: 'fa-regular fa-book-open-cover',
            onclick: () => Utilities.configItem(sheet.item)
        });
    }
});

Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
    if (game.settings.get(MODULE_ID, 'showActorButton') ?? false) {
        buttons.unshift({
            class: MODULE_ID + '-prepare-slot',
            label: '准备槽',
            icon: 'fa-regular fa-book-open-cover',
            onclick: () => Utilities.openPrepareSlot(sheet.actor, game.settings.get(MODULE_ID, 'defaultType') ?? "")
        });
    }
});