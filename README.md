# 法术书
![](https://img.shields.io/badge/Foundry-v11.315-informational)

本模组提供了可自定义的一个准备槽界面和一个法术书界面。准备槽界面是绑定角色的，法术书界面是绑定物品的。

## 使用效果
![91e50d2666d93105a8bca089ff61403b](https://github.com/EternalRider/spellbook/assets/46736326/fbbde62e-4171-441f-bb99-10a8bdcb7050)

## 操作方式
### 准备槽
#### 法术槽
- 双击：施展法术。实际上只是判断能否施展（是否被锁定或次数用完），然后触发钩子并锁定/消耗次数。触发的钩子是：`Hooks.call("preparSlotCastSpell", actor, item, {slotId, slotIndex});`
- 右键单击：查看法术。也就是打开法术的物品界面。
- alt+右键单击：如果限制方式配置为施展锁定则为锁定或解锁槽位。若为可用次数则为修改当前使用次数。用于修订误操作或特殊效果。
- ctrl+右键单击：若为可用次数则为修改最大使用次数。若为总点数值则为修改消耗点数量。用于编辑。
- shift+右键单击：修改法术槽左上角的标记。
- 拖动至另一个槽：移动至该槽，若已有法术则交换。
- 拖动至空白处：删除法术。

#### 总点数池
- alt+右键单击：修改当前点数。
- ctrl+右键单击：修改最大点数。

#### 按钮
- 配置：修改配置。
- 刷新准备槽：如果限制方式配置为施展锁定则为解锁所有槽位，若为可用次数或总点数池则为恢复所有使用次数。

### 法术书
#### 法术槽
- 右键单击：查看法术。
- 拖动至空白处：删除法术。

#### 页边
- 双击左侧页边：向前翻一页。
- 双击右侧页边：向后翻一页。

## API
```
const spellbook = game.modules.get('spellbook')?.api
spellbook.openSpellSlot(actor,type);
spellbook.openSpellBook(item);
```