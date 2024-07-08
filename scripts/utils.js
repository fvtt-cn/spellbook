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
    return await buttonDialog({ buttons: buttons, title: option.title ?? "选择", content: option.info ?? "请选择选项" });
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
    const results = await menu({
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
    let results = await menu({
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
      let img = item.getFlag(MODULE_ID, "spell-book-img") ?? { background: "modules/spellbook/img/spell-book.png", slot: "icons/sundries/documents/document-symbol-rune-tan.webp" };
      let pageNum = item.getFlag(MODULE_ID, "spell-book-page") ?? { current: 1, max: 2 };

      //弹出对话框
      let results = await menu({
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
        let prefix = "flags." + MODULE_ID;
        // let updates = { "flags.swpt.type": results.inputs[0], "flags.swpt.spell-book-page": pageNum, "flags.swpt.spell-book-img": { background: results.inputs[2], slot: results.inputs[3] } };
        let updates = {};
        updates[prefix + ".type"] = results.inputs[0];
        updates[prefix + ".spell-book-page"] = pageNum;
        updates[prefix + ".spell-book-img"] = { background: results.inputs[2], slot: results.inputs[3] };
        if (results.inputs[1]) {
          let slot = results.inputs[1];
          let slotNum = parseInt(slot);
          let slotRing = [];
          for (let i = 0; i < slotNum; i++) {
            slotRing.push(i);
          }
          updates[prefix + ".slots-config"] = slotRing;
        }
        await item.update(updates);
      }
    }
  }
}

/**
 * __`options` 属性详情__
 * | 输入类型 | 选项类型 | 默认值 | 描述 |
 * |--|--|--|--|
 * | header, info | `无` | `undefined` | 被忽略 |
 * | text, password, number | `string` | `''` | 输入的初始值 |
 * | checkbox | `boolean` | `false` | 初始选中状态 |
 * | radio | `[string, boolean]` | `['radio', false]` | 分别为组名和初始选中状态 |
 * | select | `{html: string, value: 任意类型, selected: boolean}[]` 或 `string[]` | `[]` | 选择项元素的HTML字符串，如果选中将返回的值，以及初始状态。如果仅提供了字符串，它将同时作为HTML和返回值使用。 |
 * @typedef {Object} MenuInput
 * @property {string} type 输入类型，控制显示和返回值。参见上方的“options属性详情”，以及 {@link MenuResult MenuResult.button}。
 * @property {string} label 此输入的标签元素的显示文本。接受HTML。
 * @property {boolean|string|Array<string|boolean>} [options] 参见上方的“options属性详情”。
 */
/**
 * @callback MenuCallback
 * @param {MenuResult} result 用户为此菜单选择的值（通过引用）。可用于修改或扩展返回值。
 * @param {HTMLElement} html 菜单DOM元素。
 */
/**
 * @typedef {object} MenuButton
 * @property {string} label 此按钮的显示文本，接受HTML。
 * @property {*} value 如果选中，将返回的任意对象。
 * @property {MenuCallback} [callback] 当此按钮被选中时额外执行的回调。可用于修改菜单的结果对象。
 * @property {boolean} [default] 任何真值将设置此按钮为‘提交’或‘ENTER’对话事件的默认按钮。如果没有提供，则使用最后一个提供的按钮。
 */
/**
 * @typedef {object} MenuConfig
 * @property {string} title='Prompt' 对话框标题
 * @property {string} defaultButton='Ok' 如果没有提供其他按钮，则为按钮的标签
 * @property {boolean} checkedText=false 对于类型为`'checkbox'`或`'radio'`的输入，返回相关标签的`innerText`（不含HTML）而不是其选中状态。
 * @property {Function} close=((resolve)=>resolve({buttons:false})) 如果在没有选择按钮的情况下关闭菜单时，覆盖默认行为和返回值。
 * @property {function(HTMLElement):void} render=()=>{} 
 * @property {object} options 传递给Dialog选项参数。
 */
/**
 * __`inputs` 返回详情__
 * | 输入类型 | 返回类型 | 描述 |
 * |--|--|--|
 * | header, info | `undefined` | 无返回值 |
 * | text, password, number | `string` | 最终输入的值 |
 * | checkbox, radio | `boolean\|string` | 最终选中状态。使用`checkedText`时，未选中结果为`""`，选中结果为`label`。 |
 * | select | `任意类型` | 所选下拉选项的`value`，由 {@link MenuInput MenuInput.options[i].value} 提供 |
 * @typedef {object} MenuResult
 * @property {Array} inputs 参见上方的“inputs返回详情”。
 * @property {*} buttons 所选菜单按钮的`value`，由 {@link MenuButton MenuButton.value} 提供
 */
/**
 * 异步创建一个对话框，该对话框包含一组按钮，点击按钮将返回按钮预定义的返回值。
 * @param {Object} data - 对话框的配置数据。
 * @param {string} data.title - 对话框的标题。
 * @param {string} data.content - 对话框的内容。
 * @param {Array<{label: string, value:*}>} data.buttons - 按钮的配置数组，每个元素包含label和value属性。
 * @param {string} [direction="row"] - 按钮排列的方向，默认为水平排列。
 * @param {Object} [data.options] - 对话框的其他配置选项。
 * @returns {Promise} 返回一个Promise对象，当点击按钮或关闭对话框时解析。
 */
export async function buttonDialog(data, direction = "row") {
  return await new Promise(async (resolve) => {
    /** 
     * 存储按钮配置的对象，键为按钮标签，值为包含标签和回调函数的对象。 
     * @type {Object<string, object>}
     */
    let buttons = {},
      dialog;

    // 遍历data.buttons，构建buttons对象
    data.buttons.forEach((button) => {
      buttons[button.label] = {
        label: button.label,
        callback: () => resolve(button?.value ?? button.label),
      };
    });

    // 创建对话框实例，配置包括标题、内容、按钮和关闭回调
    dialog = new Dialog(
      {
        title: data.title ?? "",
        content: data.content ?? "",
        buttons,
        close: () => resolve(false),
      },
      {
        /*width: '100%',*/
        height: "100%",
        ...data.options,
      }
    );

    // 等待对话框渲染完成
    await dialog._render(true);
    // 根据direction调整按钮的排列方向
    dialog.element.find(".dialog-buttons").css({
      "flex-direction": direction,
    });
  });
}
/**
 * 根据输入数据生成对话框的HTML代码。
 * @param {Array} data - 包含对话框输入元素配置的数组。
 * @returns {string} - 包含生成的HTML代码的字符串。
 */
export function dialogInputs(data) {
  // 遍历数据数组，处理每个输入元素
  data.forEach((inputData) => {
    if (inputData.type === "select") {
      inputData.options.forEach((e, i) => {
        switch (typeof e) {
          case "string":
            inputData.options[i] = { value: e, html: e };
            break;
          case "object":
            /* 如果没有html属性，则使用value作为html属性的值 */
            inputData.options[i].html ??= inputData.options[i].value;
            if (
              !!inputData.options[i].html &&
              inputData.options[i].value != undefined
            ) {
              break;
            }
          default:
            const emsg = "select的options数组值不符合要求";
            logger.error(emsg);
            throw new Error(emsg);
        }
      });
    }
  });

  // 将数据数组映射为HTML代码字符串
  const mapped = data
    .map(({ type, label, options }, i) => {
      type = type.toLowerCase();
      switch (type) {
        case "header":
          return `<tr><td colspan = "2"><h2>${label}</h2></td></tr>`;
        case "button":
          return "";
        case "info":
          return `<tr><td colspan="2">${label}</td></tr>`;
        case "select": {
          const optionString = options
            .map((e, i) => {
              return `<option value="${i}" ${e.selected ? 'selected' : ''}>${e.html}</option>`;
            })
            .join("");

          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><select id="${i}qd">${optionString}</select></td></tr>`;
        }
        case "radio":
          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" ${(options instanceof Array ? options[1] : false)
            ? "checked"
            : ""
            } value="${i}" name="${options instanceof Array ? options[0] : options ?? "radio"
            }"/></td></tr>`;
        case "checkbox":
          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" ${(options instanceof Array ? options[0] : options ?? false)
            ? "checked"
            : ""
            } value="${i}"/></td></tr>`;
        default:
          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" value="${options instanceof Array ? options[0] : options
            }"/></td></tr>`;
      }
    })
    .join("");

  // 构建完整的HTML表格内容
  const content = ``
    + `<table style="width:100%">`
    + `${mapped}`
    + `</table>`;

  return content;
};
/**
 * 根据数据和HTML内容，解析出相应的值。
 * 这个函数主要用于处理不同类型的表单字段，从给定的HTML片段中提取出对应的值。
 * @param {Array} data 表单数据数组，每个元素包含字段类型和选项。
 * @param {Object} html jQuery对象，表示包含表单字段的HTML片段。
 * @param {Object} options 配置对象，目前只支持一个选项checkedText，用于指示是否返回选中文字。
 * @returns {Array} 返回一个包含所有字段解析后值的数组。
 */
export function _innerValueParse(data, html, { checkedText = false }) {
  // 创建一个与data长度相同的数组，并通过map函数逐个处理每个元素。
  return Array(data.length)
    .fill()
    .map((e, i) => {
      // 解构获取当前字段的类型。
      let { type } = data[i];
      // 根据字段类型进行不同的处理。
      if (type.toLowerCase() === `select`) {
        // 如果是select类型，根据选中的选项获取值。
        return data[i].options[html.find(`select#${i}qd`).val()].value;
      } else {
        switch (type.toLowerCase()) {
          case `text`:
          case `password`:
            // 对于text和password类型，直接获取输入框的值。
            return html.find(`input#${i}qd`)[0].value;
          case `radio`:
          case `checkbox`: {
            // 对于radio和checkbox类型，判断是否选中，并根据checkedText配置决定返回值。
            const ele = html.find(`input#${i}qd`)[0];
            if (checkedText) {
              const label = html.find(`[for="${i}qd"]`)[0];
              // 如果checkedText为true且字段被选中，返回对应的标签文字。
              return ele.checked ? label.innerText : '';
            }
            // 默认情况下，返回字段的选中状态。
            return ele.checked;
          }
          case `number`:
            // 对于number类型，获取输入框的数值值。
            return html.find(`input#${i}qd`)[0].valueAsNumber;
        }
      }
    });
}
/**
 * 异步创建一个自定义对话框，用于显示输入字段和按钮。
 * @param {Object} prompts - 包含输入字段定义的对象，默认为空对象。
 * @param {Array<MenuInput>} [prompts.inputs] - 输入字段的数组。
 * @param {Array<MenuButton>} [prompts.buttons] - 按钮的数组。
 * @param {MenuConfig} config - 配置对话框行为和外观的对象，默认为空对象。
 * @returns {Promise<MenuResult>} 返回一个Promise，解析为包含用户输入和按钮点击结果的对象。
 */
export async function menu(prompts = {}, config = {}) {
  /* 定义对话框的默认配置 */
  /* 添加默认的可选参数 */
  const configDefaults = {
    title: "Prompt",
    defaultButton: "Ok",
    render: null,
    close: (resolve) => resolve({ buttons: false }),
    options: {},
  };

  /* 合并用户配置和默认配置 */
  const { title, defaultButton, render, close, checkedText, options } =
    foundry.utils.mergeObject(configDefaults, config);
  /* 合并用户定义的输入字段和按钮与默认值 */
  const { inputs, buttons } = foundry.utils.mergeObject(
    { inputs: [], buttons: [] },
    prompts
  );

  /* 返回一个Promise，处理对话框的显示和用户交互 */
  return await new Promise((resolve) => {
    /* 根据输入字段定义生成对话框内容 */
    let content = dialogInputs(inputs);
    /* 用于存储按钮的定义 */
    /** @type Object<string, object> */
    let buttonData = {};
    /* 默认选中的按钮标签 */
    let def = buttons.at(-1)?.label;
    /* 遍历按钮列表，定义按钮的行为 */
    buttons.forEach((button) => {
      /* 设置默认按钮 */
      if ("default" in button) def = button.label;
      /* 为按钮定义回调函数，处理用户点击 */
      buttonData[button.label] = {
        label: button.label,
        callback: (html) => {
          /* 解析用户输入并准备结果 */
          const results = {
            inputs: _innerValueParse(inputs, html, { checkedText }),
            buttons: button.value,
          };
          /* 如果按钮定义了回调函数，则调用该函数 */
          if (button.callback instanceof Function)
            button.callback(results, html);
          /* 解析Promise，传递结果 */
          return resolve(results);
        },
      };
    });

    /* 如果没有定义任何按钮，添加一个默认按钮 */
    /* 插入标准确认按钮 */
    if (buttons.length < 1) {
      def = defaultButton;
      buttonData = {
        [defaultButton]: {
          label: defaultButton,
          callback: (html) =>
            resolve({
              inputs: _innerValueParse(inputs, html, { checkedText }),
              buttons: true,
            }),
        },
      };
    }

    /* 创建并渲染对话框 */
    new Dialog(
      {
        title,
        content,
        default: def,
        close: (...args) => close(resolve, ...args),
        buttons: buttonData,
        render,
      },
      { focus: true, ...options }
    ).render(true);
  });
}