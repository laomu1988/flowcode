#flowcode.js增加全局变量flow

#初始化显示：
  * flow.init(viewid,data)
    * viewid:编辑区id
    * data:编辑数据

#获取数据
  * flow.getData() 取得结构存储数据
  * flow.getCode() 取得生成代码
  * flow.getBlockById(blockid) 取得数据
  * flow.getChoosed() 取得选中的节点对象
  * flow.changeChoosed(blockid|block) 更改选中的节点对象
  * flow.delete(block) 删除节点
  * flow.deleteAll() 删除所有节点

#事件侦听
  * flow.bind(type,func);增加事件侦听处理函数
  * 侦听事件有：init addblock delete textchange change error

#操作方法
  * 删除选中元素
  * 

#