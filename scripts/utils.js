// import * as CONST from './constants.js'
const MODULE_ID = 'spellbook';
import { PreparSlot } from "./function/prepar-slot.js";
import { SpellBook } from "./function/spell-book.js";

/**
 * debug输出信息函数
 */
export function debug(...args) {
  if (game.settings.get(MODULE_ID, "debug")) {
    console.log(`---------------${MODULE_ID}--------------`);
    args.forEach(arg => console.log(arg));
    console.log(`---------------${MODULE_ID}--------------`);
  }
}
/**
 * 向当前用户弹出消息提示，类型可以为info、warn或error（默认）
 * @param {"warn" | "info" | "error"} type - 通知类型
 * @param {string} message - 通知内容
 * @returns {string} - 通知内容
 */
export async function notice(type, message) {
  switch (type) {
    case "warn": // 如果通知类型为警告
      ui.notifications.warn(message); // 调用UI组件的警告通知方法
      break;
    case "info": // 如果通知类型为信息
      ui.notifications.info(message); // 调用UI组件的信息通知方法
      break;
    default: // 如果通知类型为错误
      ui.notifications.error(message); // 调用UI组件的错误通知方法
      break;
  }
  return message; // 返回通知内容
}
/**
 * 选择函数
 * 弹出一个选择框提示玩家选择选项，需要提供传入参数为预设选项，返回被选择的选项。
 * 若选项参数为某种对象的数组而非字符串数组，则还需要传入路径参数指出界面上的各选项显示的内容。
 * @param {Object} option - 选项对象
 * @param {string} option.label - 选项标签
 * @param {string} option.info - 选项信息
 * @param {Array} option.options - 选项列表
 * @param {boolean} option.path - 是否使用路径选择
 * @param {string} option.path - 路径选择
 * @param {Array} option.path - 路径选择
 * @param {string} option.button - 确定按钮文本
 * @param {string} option.title - 标题
 * @param {boolean} option.mode - 模式
 * @returns {Promise} - 异步返回结果
 */
export async function choose(option = { label: "选择：", info: "请选择选项", options: [], path: false, button: "确定", title: "选择", mode: undefined }) {
  let options = option.options ?? [];
  if (options.length <= 0) {
    notice("warn", "未传递选项内容！");
    return false;
  }
  if (typeof options[0] != 'string' && option.path) {
    if (typeof option.path == 'string') {
      options = options.map(o => o[option.path]);
    } else if (Array.isArray(option.path)) {
      let keys = option.path.join('.');
      keys = keys.split('.');
      keys.forEach(key => {
        options = options.map(o => o[key]);
      })
    }
  }
  if (option?.mode === undefined) {
    option.mode = options.length > 6 ? false : true;
  }
  if (option.mode ?? true) {
    let buttons = [];
    for (let i = 0; i < options.length; i++) {
      buttons.push({ label: options[i], value: option.options[i] });
    }
    return await warpgate.buttonDialog({ buttons: buttons, title: option.title ?? "选择", content: option.info ?? "请选择选项" });
  } else {
    let inputs = [];
    let selects = [];
    for (let i = 0; i < options.length; i++) {
      selects.push({ html: options[i], value: option.options[i] });
    }
    inputs.push({
      type: 'select',
      label: option.label ?? "选择：",
      options: selects
    });
    if (typeof option.info == "string") {
      inputs.push({
        type: 'info',
        label: option.info ?? "请选择选项"
      });
    }
    const results = await warpgate.menu({
      inputs: inputs,
      buttons: [
        { label: option.button ?? '确定', value: "OK" },
        { label: '取消', value: "cancel" }
      ]
    }, {
      title: option.title ?? '选择'
    });

    if (results.buttons === "OK") {
      // if (typeof options[0] != 'string' && option.path) {
      //   return option.options[options.findIndex(results.inputs[0])];
      // } else {
      return results.inputs[0];
      // }
    }
  }
}

/**
 * 获得物品的颜色-目前依赖rarity-colors这个mod
 * @param {Item} item 物品
 * @returns {string} 颜色
 */
export function getItemColor(item) {
  // const rankColor = {
  //   '入门': "#008000", 
  //   '行家': "#4a8396",
  //   '老练': "#0000ff",
  //   '英杰': "#ff00ff",
  //   '传奇': "#ffa500",
  //   '神器': "#ff0000",
  // }
  // let rank = item?.system?.rank ?? item?.system?.additionalStats?.rank?.value;
  // return rankColor[rank];
  return game.modules.get("rarity-colors")?.api?.getColorFromItem(item) ?? "";
}

/**
 * 打开法术槽
 * @param {Object} actor - 要打开法术槽的角色
 * @param {string} type - 要打开的法术槽的类型
 * @returns {Promise<PreparSlot>} - 返回打开的PreparSlot窗口
 */
export async function openSpellSlot(actor, type) {
  // 获取选中的actor
  let actor2 = actor ?? canvas.tokens.controlled[0]?.actor;
  if (actor2 == undefined) {
    ui.notifications.error("请选中一个token。"); // 没有选中actor
    return;
  }
  // 查找已打开的PreparSlot窗口
  const openWindow = Object.values(ui.windows).find((w) => (w instanceof PreparSlot) && (w.actor === actor2));
  if (openWindow) openWindow.close();
  else {
    let preparSlot = new PreparSlot(actor2, type);
    preparSlot.render(true);
    return preparSlot;
  };
}
/**
 * 打开法术书
 * @param {Object} item - 要打开的法术书的项目
 * @returns {Promise<SpellBook>} - 返回打开的SpellBook窗口
 */
export async function openSpellBook(item) {
  // 如果没有传递参数，则显示错误通知
  if (item == undefined) {
    ui.notifications.error("请传递一个item作为参数。"); // No Token is Selected
    return;
  }
  // 查找是否存在打开的法术书窗口
  const openWindow = Object.values(ui.windows).find((w) => (w instanceof SpellBook) && (w.item === item));
  // 如果存在，则关闭窗口
  if (openWindow) openWindow.close();
  // 如果不存在，则创建新的法术书窗口并打开
  else {
    let spellBook = new SpellBook(item);
    spellBook.render(true);
    return spellBook;
  }
}
export async function configItem(item, defaultType) {
  //配置物品是否为法术书或背包，以及背包的容量和法术书的页数

  //获取现有配置
  let type = defaultType ?? item.getFlag(MODULE_ID, "type") ?? "无";
  let types = ["无", "法术书"].map(el => { return { html: el, value: el, selected: el == type } });

  //如果是法术书并且不允许pc配置，则直接打开法术书
  if ((type == "法术书") && game.settings.get(MODULE_ID, 'allowUserConfig') == false && !game.user.isGM) {
    openSpellBook(item);
    return;
  }

  if (type == "无") {
    //弹出对话框
    let results = await warpgate.menu({
      inputs: [
        { type: 'select', label: '物品类型：', options: types },
        { type: 'info', label: "需要先配置物品类型才能展开进一步配置。" }
      ],
      buttons: [
        { label: '确定', value: "OK" },
        { label: '取消', value: "cancel" }
      ]
    }, {
      title: '物品类型配置'
    });

    //更新配置
    if (results.buttons === "OK") {
      await item.setFlag(MODULE_ID, "type", results.inputs[0]);
      await configItem(item, results.inputs[0]);
    }
  } else if (type == "法术书") {
    //选择是打开法术书还是配置法术书
    let choosed = await choose({ options: ["打开法术书", "配置法术书"], title: "选择操作", info: "请选择操作" });
    if (choosed == "打开法术书") {
      openSpellBook(item);
      return;
    } else if (choosed == "配置法术书") {
      //配置法术书的底图、槽位图标和有多少页数

      //获取现有配置
      let img = item.getFlag(MODULE_ID, "spell-book-img") ?? { background: "modules/swpt/img/spell-book.png", slot: "icons/sundries/documents/document-symbol-rune-tan.webp" };
      let pageNum = item.getFlag(MODULE_ID, "spell-book-page") ?? { current: 1, max: 2 };

      //弹出对话框
      let results = await warpgate.menu({
        inputs: [
          { type: 'select', label: '物品类型：', options: types },
          { type: 'number', label: '页数配置：', options: pageNum.max },
          { type: 'text', label: '背景图像：', options: img.background },
          { type: 'text', label: '槽位图标：', options: img.slot }
        ],
        buttons: [
          { label: '确定', value: "OK" },
          { label: '取消', value: "cancel" }
        ]
      }, {
        title: '法术书配置'
      });

      //更新配置
      if (results.buttons === "OK") {
        if (results.inputs[0] == "无") {
          await item.setFlag(MODULE_ID, "type", results.inputs[0]);
          return;
        }
        pageNum.max = results.inputs[1];
        let updates = { "flags.swpt.type": results.inputs[0], "flags.swpt.spell-book-page": pageNum, "flags.swpt.spell-book-img": { background: results.inputs[2], slot: results.inputs[3] } };
        await item.update(updates);
      }
    }
  }
}