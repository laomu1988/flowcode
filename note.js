/***
需合并文件： flowcode.js note.js Common.js Line.js Block.js flow.js flow.view.js flow.history.js flow.error.js

文件分为：
注释
Common部分：Line和Block共有部分
Line
Block
flow
event
history
error


事件： init drag drop addblock delete textchange change


#需要修改或添加
  * ok添加输入输出模块
  * ok添加撤销操作
  * 生成代码
  * ok保存数据
  * ok简化添加模块过程
  * 快速修改模块宽度及背景图片（样式）
  * 隐藏down节点模式，缩小高度

  * 动画效果
    * 删除节点时，缓慢删除
  * 读取代码，生成节点
  * 添加事件
  * 精简外部可访问属性和方法
  * CSS Sprite输出图，特别是横线和竖线两个辅助图片

  * 输出代码并执行

  * 拖动到区域外
  * 当前代码
  * 设置当前连线
#6.02
  * 拖动修改元素
  * 修改文字内容（撤销与重做）

#5.31
  * 新建注释
  * 新建模块时自动选中
  * 区分输入，输出和执行

#5.28
  * 撤销和重做
  * 修复选中子节点
  * 输入数据保存和初始化
  * 正在拖动的元素半透明效果
  * 选中节点后自动聚焦到其输入框

#5.27
  * 拖动到block上没有生成新节点
  * 删除元素


#5.26
  * 修改结构，采用数组存储
  * 取消next，prev，改用函数getNext，getPrev
  * 增加精简模式（不带）连线

#4.13
  * 修复添加循环模块时出错

#3.16
  * Editpr名称改为flow
  * 节点增加allwidth，allheight属性，表示当前节点包含其分支的大小
    * getAfterSize
    * updateFoot
    * divUpdate
    * 删除adjustPositionFrom
  * 辅助节点通过节点自动更新
  * 节点的函数属性，使用Object.prototype.func创建

#3.10
  * flow.view类，处理视图相关操作：更新视图


#模块类型
  * 顺序结构
    * next下一个节点
  * 选择结构
    * 右侧分支down:select-down
	* 下侧分支right:select-right
	* 辅助线四条：垂直辅助线（下方1，右下方2）,水平辅助线（右上侧3，右下方4），select-assist-line
  * 循环结构
    * 上方分支up:loop-up
	* 下方分支down:loop-down
	* 辅助线：垂直辅助线（左侧1，右侧2），水平辅助线（右上方3，右下方4）,loop-assist-line
	* 辅助单元快：左侧起始点5、6，右侧起始点7、8，连接下一个节点9 
*/
