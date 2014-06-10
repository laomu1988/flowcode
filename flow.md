
#flow 0.1 根据流程图生成代码
    * author:laomu1988
    * email:laomu1988@qq.com

#Block和Line共同拥有的属性
  * getFirst():取得本次连线中的第一个节点
  * getLast():取得本次连线中最后一个节点
  * getData():取得存储数据
  * getCode(mode):取得本节点及之后节点生成的代码
  * getInput():取得输入框
  * getText():取得文字内容
  * getAfterSize():获取此节点及其后的所有节点的高度和宽度，左侧凸出部分宽度
  * getBeloneBlock():当前节点在哪一个节点的分支上
  * getPath():取得节点在存储格式中的位置
  * insertBefore(block):当前元素插入block元素前
  * insertAfter(block):当前元素插入block元素后
  * appendToEnd(block):block元素插入到当前节点所在链接的最后位置
  * divObject:div视图对象
  * divUpdate():更改视图位置

#Line线条节点
  * updateAssist():更新视图大小及位置

#Block模块节点
  * addDirection(block, direction):在各个方向上添加节点

#flow流程图操作函数
  * log():输出代码
  * init(viewId, data):初始化编辑区域
    * param:viewId:编辑区域id
    * param:data:初始数据
  * add(key, attr):根据属性增加模块
    * * key:节点类型或者模块数据[必须]
    * * attr:模块属性[可选]
  * addLine(type, attrs):增加连线
    * param:type 连线类型
  * addBlock(type, attrs):增加代码模块
    * param type:模块类型
  * addObj(obj):增加节点元素，right，up等可以带有节点
  * getBlockById(blockid):根据id取得Block
  * getData(obj):取得生成的数据
  * bind(type, func):绑定事件
    * param:type 事件类型
    * param:func 事件处理函数
  * fire(type, data):启动事件
    * param type:事件类型
    * param data:数据{a:0,b:1}
  * unbind(type, func):取消绑定事件
  * update():更新视图模块位置，根据开始模块位置，调整所有模块的位置
  * getBlockByPath(path):根据路径取得节点
  * insertBlockByPath(block, path):根据路径添加节点
  * deleteChoosed():删除当前选中节点
  * changeChoosed(obj):更改当前选中的元素
  * getCode():取得生成的代码

#flow.history 操作历史
  * redo():重做操作
  * undo():撤销操作
  * canRedo():能否重做
  * canUndo():能否撤销
  * getRedo():取得重做操作名称
  * getUndo():取得撤销操作名称

#错误处理
  * addError(msg, obj):添加错误
  * extend(name,func):为flow添加函数
    * * name:函数名称
    * * func:函数
  * extend2block(name,func):添加节点属性或操作函数，函数内this代表block
    * * 注意：节点可能是block或者连线或辅助线assistLine
