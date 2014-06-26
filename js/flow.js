/**#flow 0.1 根据流程图生成代码
* @author:laomu1988
* @email:laomu1988@qq.com
*/
/*
todoList
  × 选择和循环显示是或否
    * 是或者否互调
    * 显示连线
  * 分步调试
  * 执行
*/
(function(window, $) {
  'use strict';
  var _blocks = {},
  //所有blocks的记录
  _lines = {},
  //所有连线
  _assists = {},
  //辅助节点列表
  _starts = [],
  _data = []; //内部数据
  var _setting = {
    viewId: '',
    blockwidth: 100,
    blockheight: 40,
    lineheight: 20,
    loopAssistWidth: 50,
    block: 'start,input,output,exec,select,loop,note',
    line: 'select-down,select-rightdown,select-right,loop-down,loop-up',
    debug: true,
    trace: false,
    withLoopAssistWidth: ",loop-assist-line1,loop-assist-line5,loop-assist-line6,loop-assist-line2,loop-assist-line7,loop-assist-line8,",
    getWH: function(type) {
      var width = _setting.blockwidth;
      var height = _setting.lineheight;
      switch (type) {
      case "start":
      case "end":
      case "loop":
      case "exec":
      case "select":
      case "input":
      case "output":
        width = _setting.blockwidth;
        height = _setting.blockheight;
        break;
      default:
        if (_setting.withLoopAssistWidth.indexOf("," + type + ",") >= 0) {
          width = _setting.loopAssistWidth;
        }
      }
      return {
        "width": width,
        "height": height
      };
    },
    //取得辅助节点数目
    getAssistNumber: function(type) {
      if (type === "select") {
        return 4;
      }
      if (type === "loop") {
        return 11;
      }
      return 0;
    }
  };
  /**#Block和Line共同拥有的属性*/
  var Common = {
    blockid: "",
    type: "",
    //父节点
    parent: null,
    /*大小和位置*/
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    _x: -1,
    _y: -1,
    _width: -1,
    _height: -1,
    //模块的整个宽度和高度:特别是选择模块，循环模块
    allwidth: -1,
    allheight: -1,
    leftwidth: 0,
    //左侧凸出部分宽度，循环结构使用
    /**取得本次连线中的第一个节点*/
    getFirst: function() {
      if (this.parent && $.isArray(this.parent)) {
        return this.parent[0];
      }
      return null;
    },
    /**取得本次连线中最后一个节点*/
    getLast: function() {
      if (this.parent && $.isArray(this.parent)) {
        return this.parent[this.parent.length - 1];
      }
      return null;
    },
    /**取得本节点及内部节点的json格式数据*/
    getData: function() {
      var data = '';
      if (this.isBlock()) {
        data = '{"type":"' + this.type + '"';
        var text = this.getText();
        if (text && text.length > 0) {
          text = text.replace(/"/g, '\\"');
          data += ',"text":"' + text + '"';
        }
        if (this.type === "start" || this.type === "note") {
          data += ',"x":' + this.x + ',"y":' + this.y;
        }
        var sdata = '';
        if (this.right) {
          sdata = this.right[0].getData();
          if (sdata !== '') {
            data += ',"right":[' + sdata + ']';
          }
        }
        if (this.up) {
          sdata = this.up[0].getData();
          if (sdata !== '') {
            data += ',"up":[' + sdata + ']';
          }
        }
        if (this.down) {
          sdata = this.down[0].getData();
          if (sdata !== '') {
            data += ',"down":[' + sdata + ']';
          }
        }
        data += '}';
      }
      return data;
    },
    /**取得本节点及内部节点生成的代码*/
    getCode: function(mode) {
      if (this.isLine()) {
        return '';
      }
      var code = '',
      i = 0,
      right = '',
      down = '',
      up = '',
      inputval = '',
      input;
      input = $("[blockid=" + this.blockid + "] input");
      if (input.length > 0) {
        inputval = input.val();
      }
      if (this.right) {
        for (i = 0; i < this.right.length; i++) {
          right += this.right[i].getCode(mode);
        }
      }
      if (this.up) {
        for (i = 0; i < this.up.length; i++) {
          up += this.up[i].getCode(mode);
        }
      }
      if (this.down) {
        for (i = 0; i < this.down.length; i++) {
          down += this.down[i].getCode(mode);
        }
      }

      switch (this.type) {
      case "start":
        return '';
      case "end":
        return "";
      case "exec":
        return inputval + ";\n";
      case "select":
        inputval = inputval.replace(/并/g, '&&');
        inputval = inputval.replace(/或/g, '||');
        return "if(" + inputval + "){\n" + down + "\n}else{\n" + right + "}\n";
      case "loop":
        inputval = inputval.replace(/并/g, '&&');
        inputval = inputval.replace(/或/g, '||');
        return "do{\n" + up + "if(" + inputval + "){break;}\n" + down + "\n}while(true);\n";
      case "input":
        var inputdatas = inputval.split(",");
        var code = '';
        for(i = 0;i<inputdatas.length;i++){
          if($.trim(inputdatas[i]) === ''){
            continue;
          }
          code += inputdatas[i]+" = input();\n";
        }
        return code;
      case "output":
        return "print(" + inputval + ");\n";
      case "note":
        return "";
      default:
        flow.addError("getCode未处理的模块类型！" + this.type, this);
        break;
      }
    },
    /**取得输入框*/
    getInput: function() {
      if (this.isBlock && this.isBlock() && this.divObject) {
        return this.divObject.find("#input" + this.blockid);
      }
      return null;
    },
    /**取得文字内容*/
    getText: function() {
      var input = this.getInput();
      if (input) {
        return input.val();
      }
      if (this.text) {
        return this.text;
      }
      return '';
    },
    /**获取此节点及其后的所有节点的高度和宽度，左侧凸出部分宽度*/
    getAfterSize: function() {
      var width = this.allwidth,
      height = this.allheight,
      leftwidth = this.leftwidth;
      var next = this.getNext();
      if (next) {
        var size = next.getAfterSize();
        width = size.w > width ? size.w: width;
        height += size.h;
        leftwidth = leftwidth > size.lw ? leftwidth: size.lw;
      }
      return {
        w: width,
        h: height,
        lw: leftwidth
      };
    },
    getNext: function() {
      if (this.parent && $.isArray(this.parent)) {
        for (var i = 0; i < this.parent.length; i++) {
          if (this.parent[i] === this) {
            return this.parent[i + 1];
          }
        }
        return null;
      }
      return null;
    },
    getPrev: function() {
      if (this.parent && $.isArray(this.parent)) {
        for (var i = 0; i < this.parent.length; i++) {
          if (this.parent[i] === this) {
            return this.parent[i - 1];
          }
        }
        return null;
      }
      return null;
    },
    getAbsolutePosition: function() {
      var ps = {
        x: this.x,
        y: this.y
      },
      ps2;
      var p = this.getBeloneBlock();
      if (p && p.isBlock) {
        ps2 = p.getAbsolutePosition();
        ps.x += ps2.x;
        ps.y += ps2.y;
      }
      return ps;
    },
    /**当前节点在哪一个节点的分支上*/
    getBeloneBlock: function() {
      var p = this.parent;
      if (p && p.isBlock) {
        return p;
      }
      for (var i in _blocks) {
        var b = _blocks[i];
        if (b.right === p || b.down === p || b.up === p) {
          return b;
        }
      }
      return null;
    },
    /**取得该节点所在分支名称：up,right,down,或者''*/
    getBranchName:function(){
      var p = this.getBeloneBlock();
      if(p){
        if(p.right === this.parent){
          return "right";
        }else if(p.up === this.parent){
          return "up";
        }else if(p.down === this.parent){
          return "down";
        }
      }
      return '';
    },
    /*取得该元素在数组中的位置*/
    getPlace: function() {
      if (!$.isArray(this.parent)) {
        return - 1;
      }
      for (var i = 0; i < this.parent.length; i++) {
        if (this.parent[i] === this) {
          return i;
        }
      }
      return - 1;
    },
    /**取得节点在存储格式中的位置*/
    getPath: function() {
      if (!this.parent) {
        return '';
      }
      var b = this.getBeloneBlock();
      if (!b) {
        if (!this.parent || !$.isArray(this.parent)) {
          return '';
        }
        var root = _data;
        for (var i = 0; i < root.length; i++) {
          if (root[i] === this.parent) {
            return i + "." + this.getPlace();
          }
        }
        return this.getPlace() + '';
      }
      if (this.isAssist()) {
        return b.getPath() + '.assist';
      }
      var bpath = b.getPath();
      if (b.up === this.parent) {
        return bpath + ".up." + this.getPlace();
      } else if (b.down === this.parent) {
        return bpath + ".down." + this.getPlace();
      } else if (b.right === this.parent) {
        return bpath + ".right." + this.getPlace();
      }
      flow.addError("getPath未知类型" + this.type, this);
    },
    /*判断是否是Line节点*/
    isLine: function() {
      return this.blockid && this.blockid.indexOf("line") >= 0;
    },
    /*判断是否是block节点*/
    isBlock: function() {
      return this.blockid && this.blockid.indexOf("block") >= 0;
    },
    isAssist: function() {
      return this.blockid && this.blockid.indexOf("assist") >= 0;
    },
    /**当前元素插入block元素前*/
    insertBefore: function(block) {
      flow.log("将节点%o插入到节点%o前", this, block);
      if (!block) {
        return this;
      }
      if (this === block) {
        flow.addError("在一个元素前添加同一个元素", this);
        return this;
      }
      if (!this.isBlock() && this.type === block.type) {
        flow.addError("不能将类型相同的线条元素连接起来", this);
        return false;
      }
      switch (block.type) {
      case "select-right":
      case "loop-up":
        return this.insertAfter(this);
      default:
        break;
      }
      this.parent = block.parent;
      var place = block.getPlace();
      block.parent.splice(place, 0, this);
      return this;
    },
    /**当前元素插入block元素后*/
    insertAfter: function(block) {
      flow.log("将节点%o插入到节点%o后", this, block);
      if (!block) {
        return this;
      }
      switch (block.type) {
      case "select-down":
      case "select-rightdown":
      case "loop-down":
      case "end":
        return this.insertBefore(block);
      default:
        break;
      }
      /*添加节点到辅助节点后*/
      if (block.type.indexOf('assist') >= 0) {
        switch (block.type) {
        case "select-assist-line3":
          block = block.parent.right[0];
          break;
        case "select-assist-line1":
          block = block.parent.down[0].getLast();
          break;
        case "select-assist-line2":
        case "select-assist-line4":
          block = block.parent.right[0].getLast();
          break;
        case "loop-assist-line1":
        case "loop-assist-line5":
        case "loop-assist-line6":
        case "loop-assist-line9":
        case "loop-assist-line10":
        case "loop-assist-line11":
          block = block.parent.getNext();
          break;
        case "loop-assist-line2":
        case "loop-assist-line3":
        case "loop-assist-line4":
        case "loop-assist-line7":
        case "loop-assist-line8":
          block = block.parent.down[0].getLast();
          break;
        }
        return this.insertAfter(block);
      }
      this.parent = block.parent;
      var place = block.getPlace();
      block.parent.splice(place + 1, 0, this);

      var down, next;
      return this;
    },
    /*更改文字内容*/
    changeText: function(text) {
      this.text = text;
      var input = this.getInput();
      if (input) {
        input.val(text);
      }
    },
    /**block元素插入到当前节点所在链接的最后位置*/
    appendToEnd: function(block) {
      var end = block.getLast();
      this.insertAfter(end);
    },
    /**div视图对象*/
    divObject: null,
    updateSize: function() {
      var w1 = 0,
      w2 = 0,
      h1 = 0,
      h2 = 0,
      lw1 = 0,
      lw2 = 0,
      i = 0;
      switch (this.type) {
      case "select":
        for (i = 0; i < this.down.length; i++) {
          this.down[i].updateSize();
          w1 = this.down[i].allwidth > w1 ? this.down[i].allwidth: w1;
          h1 += this.down[i].allheight;
          lw1 = this.down[i].leftwidth > lw1 ? this.down[i].leftwidth: lw1;
        }
        for (i = 0; i < this.right.length; i++) {
          this.right[i].updateSize();
          w2 = this.right[i].allwidth > w2 ? this.right[i].allwidth: w2;
          h2 += this.right[i].allheight;
          lw2 = this.right[i].leftwidth > lw2 ? this.right[i].leftwidth: lw2;
        }
        this.leftwidth = lw1;
        this.downwidth = w1 + lw2;
        this.downheight = h1;
        this.rightwidth = w2;
        this.rightheight = h2;
        this.allwidth = w1 + w2 + lw2; //size1.w + size2.w + size2.lw;
        this.allheight = h1 + _setting.blockheight > h2 ? h1 + _setting.blockheight: h2 + (_setting.blockheight - _setting.lineheight) / 2;
        break;
      case "loop":
        for (i = 0; i < this.up.length; i++) {
          this.up[i].updateSize();
          w1 = this.up[i].allwidth > w1 ? this.up[i].allwidth: w1;
          h1 += this.up[i].allheight;
          lw1 = this.up[i].leftwidth > lw1 ? this.up[i].leftwidth: lw1;
        }
        for (i = 0; i < this.down.length; i++) {
          this.down[i].updateSize();
          w2 = this.down[i].allwidth > w2 ? this.down[i].allwidth: w2;
          h2 += this.down[i].allheight;
          lw2 = this.down[i].leftwidth > lw2 ? this.down[i].leftwidth: lw2;
        }
        this.upwidth = w1;
        this.upheight = h1;
        this.downwidth = w2;
        this.downheight = h2;
        this.allwidth = (w1 > w2 ? w1: w2) + _setting.loopAssistWidth;
        this.allheight = h1 + h2 + _setting.lineheight + _setting.blockheight;
        this.leftwidth = (lw2 + _setting.loopAssistWidth) > lw1 ? (lw2 + _setting.loopAssistWidth) : lw1;
        break;
      default:
        this.allwidth = this.width;
        this.allheight = this.height;
        this.leftwidth = 0;
        break;
      }
      return this;
    },
    updatePosition: function(x, y) {
      if (typeof x !== "undefined" && typeof y !== "undefined") {
        this.x = x;
        this.y = y;
      }
      var i = 0,
      b;
      x = 0;
      y = 0;
      switch (this.type) {
      case "select":
        y = this.height;
        for (i = 0; i < this.down.length; i++) {
          this.down[i].updatePosition(x, y);
          y += this.down[i].allheight;
        }
        x = this.downwidth;
        y = (_setting.blockheight - _setting.lineheight) / 2;
        for (i = 0; i < this.right.length; i++) {
          this.right[i].updatePosition(x, y);
          y += this.right[i].allheight;
        }
        break;
      case "loop":
        y = -this.upheight;
        for (i = 0; i < this.up.length; i++) {
          this.up[i].updatePosition(x, y);
          y += this.up[i].allheight;
        }
        y = this.height;
        for (i = 0; i < this.down.length; i++) {
          this.down[i].updatePosition(x, y);
          y += this.down[i].allheight;
        }
        break;
      case "select-down":
        b = this.getBeloneBlock();
        this.y = b.allheight - this.height;
        break;
      case "select-rightdown":
        b = this.getBeloneBlock();
        this.y = b.allheight - this.height;
        break;
      case "loop-up":
        b = this.getBeloneBlock();
        this.y = -b.upheight;
        break;
      default:
        break;
      }
      if (this.x !== this._x || this.y !== this._y) {
        flow.view.addNeedUpdate(this);
      }

      for (i = this.assists ? this.assists.length - 1 : -1; i >= 0; i--) {
        this.assists[i].updateAssist();
        flow.view.addNeedUpdate(this.assists[i]);
      }
      return this;
    },
    /**更改视图位置*/
    divUpdate: function() {
      var temp;
      var x = this.x,
      y = this.y;
      if (this.type === "loop") {
        y = this.y + this.upheight;
      }
      if (!this.divObject) {
        temp = $("[blockid=" + this.blockid + "]");
        if (temp.length > 0) {
          this.divObject = temp;
        } else {
          this._x = this.x;
          this._y = this.y;
          this._width = this.width;
          this._height = this.height;
          var str = "";
          if (this.isBlock()) {
            str += '<div blockid="' + this.blockid + '" class="block ' + this.type + '" blockType="' + this.type + '" style="top:' + y + 'px;left:' + x + 'px;">';

            if (this.type !== "start" && this.type !== "end" && this.type !== "note") {
              if (this.type === "input") {
                str += '<span>输入</span>';
                str += '<input type="text" size=5 id="input' + this.blockid + '" value="' + this.text + '"/>';
              } else if (this.type === "output") {
                str += '<span>输出</span>';
                str += '<input type="text" size=5 id="input' + this.blockid + '" value="' + this.text + '"/>';
              }else if(this.type==="loop" || this.type === "select"){
                str += '<span class="triangle-left"></span><input type="text" size=8 id="input' + this.blockid + '" value="' + this.text + '"/><span class="triangle-right"></span>';
              } else {
                str += '<input type="text" size=8 id="input' + this.blockid + '" value="' + this.text + '"/>';
              }
            } else if (this.type === "start") {
              str += "开始";
            } else if (this.type === "end") {
              str += "结束";
            } else if (this.type === "note") {
              this.width = 200;
              this.height = 60;
              str += '<textarea size=5 id="input' + this.blockid + '">' + this.getText() + '</textarea>';
            }
          } else {
            str += '<div blockid="' + this.blockid + '" class="line ' + this.type + '" blockType="' + this.type + '" style="top:' + y + 'px;left:' + x + 'px;width:' + this.width + 'px;height:' + this.height + 'px;">';
          }

          str += "</div>";
          this.divObject = $(str);
          var p = this.getBeloneBlock();
          if (p) {
            if (p.divObject) {
              p.divObject.append(this.divObject);
            } else {
              p.divUpdate();
              p.divObject.append(this.divObject);
            }
          } else {
            $("#" + _setting.viewId).append(this.divObject);
          }
          //节点鼠标点击对象时，自动选中对象
          if (this.isBlock()) {
            this.divObject.bind("mousedown",
            function(e) {
              flow.view.changeChoosed($(this));
              e.stopPropagation();
            });
            var input = this.getInput();
            var block = this;
            if (input && input.length > 0) {
              input.bind('input propertychange',
              function(event) {
                flow.view.changeTextEvent(block, $(this).val());
              });
            }
          }
          temp = this.divObject;
          this.divObject.droppable({
            hoverClass: 'hovered',
            drop: function(e, ui) {
              flow.log("drop and ui");
              flow.view.changeLatestDrop("block");
              flow.log(e);
              flow.view.dropBlockTo(ui.draggable, temp);
              e.stopPropagation();
              e.preventDefault();
              return false;
            }
          });
          if (!this.isLine()) {
            //div可以被拖动
            this.divObject.draggable({
              cursor: 'move',
              containment: 'view',
              helper: "clone",
              stop: flow.view.onStopDrag
            });
          }
        }
      }
      if (this._x !== x) {
        this._x = x;
        this.divObject.css("left", x + "px");
      }
      if (this._y !== y) {
        this._y = y;
        this.divObject.css("top", y + "px");
      }
      if (this._width !== this.width) {
        this._width = this.width;
        this.divObject.css("width", this.width + "px");
      }
      if (this._height !== this.height) {
        this._height = this.height;
        this.divObject.css("height", this.height + "px");
      }
      if (this.assists && this.assists.length > 0) {
        for (var i in this.assists) {
          this.assists[i].divUpdate();
        }
      }
      return this;
    },
    delete: function() {
      if (this.divObject) {
        this.divObject.remove();
        this.divObject = null;
      }
      if (this.parent && $.isArray(this.parent)) {
        this.parent.splice(this.getPlace(), 1);
      }

      delete _blocks[this.blockid];
      for (var i in this.assists) {
        this.assists[i].delete();
        delete this.assists[i];
      }
      var j;
      if (this.right) {
        for (j = 0; j < this.right.length; j++) {
          this.right[j].delete();
        }
      }
      if (this.up) {
        for (j = 0; j < this.up.length; j++) {
          this.up[j].delete();
        }
      }
      if (this.down) {
        for (j = 0; j < this.down.length; j++) {
          this.down[j].delete();
        }
      }
    }
  };
  /**#Line线条节点*/
  /* type:节点类型，down(节点之间的连线),select-right(选择结构右上角),select-down(选择结构左下角),select-rightdown(选择结构右下角)
    */
  function Line(type, attrs) {
    //辅助线
    if (type.indexOf("assist") >= 0) {
      this.blockid = "flow_line_assist_" + (++Line.count);
      _assists[this.blockid] = this;
    } else {
      this.blockid = "flow_line_" + (++Line.count);
    }
    this.type = type;
    var wh = _setting.getWH(type);
    this.width = wh.width;
    this.height = wh.height;
    if (attrs) {
      for (var i in attrs) {
        this[i] = attrs[i];
      }
    }
    _blocks[this.blockid] = this;

    this.x = this.x < 0 ? 0 : this.x;
    this.y = this.y < 0 ? 0 : this.y;
    this.allwidth = this.width;
    this.allheight = this.height;
    return this;
  }
  Line.count = 0;
  Line.prototype = Common;
  /**更新视图大小及位置*/
  Line.prototype.updateAssist = function() {
    //console.log("updateFoot:%s %o",this.blockid,this);
    //假如是辅助节点，更改其位置和大小
    if (this.parent && this.type.indexOf("assist") >= 0) {
      var parent = this.parent;
      switch (this.type) {
      case "select-assist-line1":
        this.x = 0;
        this.y = 0 + parent.downheight + _setting.blockheight - _setting.lineheight;
        this.height = parent.allheight - parent.downheight - _setting.blockheight;
        break;
      case "select-assist-line2":
        this.x = 0 + parent.downwidth;
        this.y = parent.right[0].y + parent.rightheight - _setting.lineheight;
        this.height = parent.allheight - parent.rightheight - (_setting.blockheight - _setting.lineheight) / 2;
        break;
      case "select-assist-line3":
        this.x = 0 + _setting.blockwidth;
        this.y = 0 + (_setting.blockheight - _setting.lineheight) / 2;
        this.width = parent.downwidth - _setting.blockwidth;
        break;
      case "select-assist-line4":
        this.x = 0 + _setting.blockwidth;
        this.y = 0 + parent.allheight - _setting.lineheight;
        this.width = parent.downwidth - _setting.blockwidth;
        break;
      case "loop-assist-line1":
        this.x = 0 - parent.leftwidth;
        this.y = 0 + (_setting.blockheight + _setting.lineheight) / 2 + parent.upheight;
        this.height = parent.downheight + _setting.blockheight - _setting.lineheight;
        break;
      case "loop-assist-line2":
        this.x = 0 + parent.allwidth - _setting.loopAssistWidth;
        this.y = 0 + _setting.lineheight;
        this.height = parent.allheight - 3 * _setting.lineheight;
        break;
      case "loop-assist-line3":
        this.x = 0 + _setting.blockwidth;
        this.y = 0;
        this.width = parent.allwidth - _setting.blockwidth - _setting.loopAssistWidth;
        break;
      case "loop-assist-line4":
        this.x = 0 + _setting.blockwidth;
        this.y = 0 + parent.downheight + _setting.blockheight - _setting.lineheight + parent.upheight;
        this.width = parent.allwidth - _setting.blockwidth - _setting.loopAssistWidth;
        break;
      case "loop-assist-line5":
        this.x = 0 - parent.leftwidth;
        this.y = 0 + (_setting.blockheight - _setting.lineheight) / 2 + parent.upheight;
        break;
      case "loop-assist-line6":
        this.x = 0 - parent.leftwidth;
        this.y = 0 + parent.downheight + _setting.blockheight + parent.upheight;
        break;
      case "loop-assist-line7":
        this.x = 0 + parent.allwidth - _setting.loopAssistWidth;
        this.y = 0;
        break;
      case "loop-assist-line8":
        this.x = 0 + parent.allwidth - _setting.loopAssistWidth;
        this.y = 0 + parent.downheight + _setting.blockheight - _setting.lineheight + parent.upheight;
        break;
      case "loop-assist-line9":
        this.x = 0;
        this.y = 0 + parent.downheight + _setting.blockheight + parent.upheight;
        break;
      case "loop-assist-line10":
        this.x = 0 - parent.leftwidth + _setting.loopAssistWidth;
        this.y = 0 + (_setting.blockheight - _setting.lineheight) / 2 + parent.upheight;
        this.width = parent.leftwidth - _setting.loopAssistWidth;
        break;
      case "loop-assist-line11":
        this.x = 0 - parent.leftwidth + _setting.loopAssistWidth;
        this.y = 0 + parent.downheight + _setting.blockheight + parent.upheight;
        this.width = parent.leftwidth - _setting.loopAssistWidth;
        break;
      }
      if (this.type.indexOf("loop") >= 0) {
        this.y -= parent.upheight;
      }
      var ps = this.getAbsolutePosition();
      if (ps.x < 0) {
        flow.view.needMove( - (ps.x));
      }
      if (ps.y < 0) {
        flow.view.needMove(0, -(ps.y));
      }
    }
    this.allwidth = this.width;
    this.allheight = this.height;
    flow.view.addNeedUpdate(this);
    return this;
  };
  /**#Block模块节点*/
  function Block(type, attrs) {
    var i, temp = (this.blockid = "flow_block_" + (++Block.count),
    //当前blockid
    this.type = type, this.text = '',
    //类型 顺序exec或者Exce，选择select，循环loop
    this.width = _setting.blockwidth, this.height = _setting.blockheight,

    /*分支结构*/
    //右侧分支起始节点id
    this.right = undefined, this.rightwidth = 0, this.rightheight = 0,

    //下方分支起始节点id（选择结构和循环结构）
    this.down = undefined, this.downwidth = 0, this.downheight = 0,

    /*循环结构*/
    this.up = undefined, this.upwidth = 0, this.upheight = 0);
    if (type === "select") {
      this.right = [];
      this.right.push(new Line("select-right", {
        parent: this.right
      }));
      this.down = [];
      this.down.push(new Line("select-down", {
        parent: this.down
      }));
      var rightdown = new Line("select-rightdown", {
        parent: this.down
      });
      rightdown.insertAfter(this.right[0]);
    } else if (type === "loop") {
      this.up = [];
      this.down = [];
      this.up.push(new Line("loop-up", {
        parent: this.up
      }));
      this.down.push(new Line("loop-down", {
        parent: this.down
      }));
    }
    if (_setting.getAssistNumber(this.type) > 0) {
      var num = _setting.getAssistNumber(this.type);
      this.assists = [];
      for (i = 0; i < num; i++) {
        this.assists.push(new Line(this.type + "-assist-line" + (i + 1), {
          parent: this
        }));
      }
    }
    if (attrs) {
      if (typeof attrs.x !== "undefined") {
        this.x = parseInt(attrs.x);
      }
      if (typeof attrs.y !== "undefined") {
        this.y = parseInt(attrs.y);
      }
      if (typeof attrs.text !== "undefined") {
        this.text = attrs.text;
      }
    }
    _blocks[this.blockid] = this;
    this.x = this.x < 0 ? 0 : this.x;
    this.y = this.y < 0 ? 0 : this.y;
  }
  Block.count = 0;
  Block.prototype = Common;
  /**在各个方向上添加节点*/
  Block.prototype.addDirection = function(block, direction) {
    if (!block || !direction) {
      return;
    }
    if (!this.isBlock()) {
      return;
    }
    if ($.isArray(block)) {
      for (var i = 0; i < block.length; i++) {
        this.addDirection(block[i], direction);
      }
      return this;
    }
    switch (direction) {
    case "right":
      block.insertAfter(this.right[0]);
      break;
    case "down":
      block.insertAfter(this.down[0]);
      break;
    case "up":
      block.insertAfter(this.up[0]);
      break;
    }
  };

  /**#flow流程图操作函数*/
  var flow = {
    /**输出代码*/
    log: function() {
      if (!_setting.debug) {
        return false;
      }
      try {
        if (arguments.length === 1) {
          console.log(arguments[0]);
        } else if (arguments.length > 0) {
          console.log(arguments);
          /*!需要完善*/
        }
        if (_setting.trace) {
          console.trace();
        }
      } catch(err) {}
    },
    /**初始化编辑区域
        @param:viewId:编辑区域id
        @param:data:初始数据
        */
    init: function(viewId, data) {
      _setting.viewId = viewId;
      $(".block").draggable({
        cursor: 'move',
        containment: 'view',
        helper: "clone",
        stop: flow.view.onStopDrag
      });
      $("#" + viewId).parent().droppable({
        drop: function(e, ui) {
          flow.log("drop to view");
          flow.view.changeLatestDrop("view");
        }
      });
      if (!data) {
        return;
      }
      /*已经初始化过对象了*/
      if (_data && _data.length > 0) {
        var bak = [];
        for (var i = 0; i < _data.length; i++) {
          bak.push(_data[i]);
        }
        flow.deleteAll(true);
        _action.reinit(bak, newStr);
      } else {
        _action.init(data);
      }
      if (typeof data === "string") {
        data = $.parseJSON(data);
      }
      _data = flow.addObj(data);
      flow.view.update();
      if (_starts.length > 0) {
        flow.view.changeChoosed(_starts[0]);
      }
      return flow;
    },
    deleteAll: function(obj) {
      if (!obj) {
        obj = _data;
      }
      flow.delete(obj);
    },
    delete: function(obj) {
      if ($.isArray(obj)) {
        for (var i = obj.length - 1; i >= 0; i--) {
          flow.delete(obj[i]);
        }
        var root = _data;
        for (i = 0; i < root.length; i++) {
          if (root[i] === obj) {
            root.splice(i, 1);
          }
        }
      } else if (obj && obj.delete) {
        obj.delete();
        return;
      }
      flow.log("空删除！%o", obj);
    },
    /**根据属性增加模块
    * key:节点类型或者模块数据[必须]
    * attr:模块属性[可选]
    */
    add: function(key, attr) {
      if (!key) {
        return false;
      }
      if (typeof key === "string") {
        if (_setting.block.indexOf(key) >= 0) {
          return flow.addBlock(key, attr);
        }
        if (_setting.line.indexOf(key) >= 0 || key.indexOf("line") >= 0) {
          return flow.addLine(key, attr);
        }
      } else {
        return flow.addObj(key);
      }
    },
    /**增加连线
    * @param:type 连线类型
    */
    addLine: function(type, attrs) {
      var line = new Line(type, attrs);
      return line;
    },
    /**增加代码模块
    * @param type:模块类型
    */
    addBlock: function(type, attrs) {
      if (!type) {
        return null;
      }
      switch (type) {
      case "start":
      case "exec":
      case "input":
      case "output":
      case "end":
      case "select":
      case "loop":
      case "note":
        break;
      default:
        flow.addError("flow.addBlock正在添加未知类型模块:" + type);
        return false;

      }
      var block = new Block(type, attrs);
      if (type === "start") {
        _starts.push(block);
      }
      return block;
    },
    /**增加节点元素，right，up等可以带有节点*/
    addObj: function(obj) {
      var out = null,
      a;
      if (typeof obj === "string") {
        obj = $.parseJSON(obj);
      }
      if ($.isArray(obj)) {
        out = [];
        for (var i = 0; i < obj.length; i++) {
          out.push(flow.addObj(obj[i]));
        }
        for (i = 0; i < out.length; i++) {
          out[i].parent = out;
        }
      } else {
        out = flow.addBlock(obj.type, obj);
        if (obj.right) {
          a = flow.addObj(obj.right);
          out.addDirection(a, "right");
        }
        if (obj.up) {
          a = flow.addObj(obj.up);
          out.addDirection(a, "up");
        }
        if (obj.down) {
          a = flow.addObj(obj.down);
          out.addDirection(a, "down");
        }
      }
      return out;
    },
    /**根据id取得Block*/
    getBlockById: function(blockid) {
      return _blocks[blockid];
    },
    /**取得生成的数据*/
    getData: function(obj) {
      var root = obj,
      i, code;
      if (!root) {
        root = _data;
      }
      if (root && root.getData) {
        return root.getData();
      }
      if ($.isArray(root)) {
        code = '[';
        for (i = 0; i < root.length; i++) {
          var d = root[i];
          var c = flow.getData(d);
          if (c && c.length > 0) {
            var temp = code.charAt(code.length - 1);
            if (temp === "}" || temp === "]") {
              code += ',';
            }
            code += c;
          }
        }
        code += ']';
        return code;
      }
      return '';
    }
  };

  /*--------------------------------------------------------------*/
  /*flow event*/
  flow._listeners = {};
  /**绑定事件
    @param:type 事件类型
    @param:func 事件处理函数*/
  flow.bind = function(type, func) {
    var listeners = flow._listeners;
    if (typeof listeners[type] === "undefined") {
      listeners[type] = [];
    }
    if (typeof func === "function") {
      listeners[type].push(func);
    }
    return flow;
  };
  /**启动事件
  @param type:事件类型
  @param data:数据{a:0,b:1}
  */
  flow.fire = function(type, data) {
    flow.log("fire event: " + type);
    var arrayEvent = flow._listeners[type];
    if (arrayEvent instanceof Array) {
      for (var i = 0,
      length = arrayEvent.length; i < length; i += 1) {
        if (typeof arrayEvent[i] === "function") {
          arrayEvent[i](type, data);
        }
      }
    }
    return flow;
  };
  /**取消绑定事件*/
  flow.unbind = function(type, func) {
    var arrayEvent = flow._listeners[type];
    if (typeof type === "string" && arrayEvent instanceof Array) {
      if (typeof func === "function") {
        // 清除当前type类型事件下对应fn方法
        for (var i = 0,
        length = arrayEvent.length; i < length; i += 1) {
          if (arrayEvent[i] === func) {
            flow._listeners[type].splice(i, 1);
            break;
          }
        }
      } else {
        // 如果仅仅参数type, 或参数fn邪魔外道,则所有type类型事件清除
        delete flow._listeners[type];
      }
    }
    return flow;
  };

  flow.view = {
    _needMoveX: 0,
    _needMoveY: 0,
    /*需要更新*/
    needMove: function(vx_, vy_) {
      if (flow.view._needMoveX < vx_) {
        flow.view._needMoveX = vx_;
      }
      if (flow.view._needMoveY < vy_) {
        flow.view._needMoveY = vy_;
      }
    },
    _needUpdateArray: [],
    addNeedUpdate: function(obj) {
      var array = flow.view._needUpdateArray;
      for (var i = 0; i < array.length; i++) {
        if (array[i] === obj) {
          return;
        }
      }
      array.push(obj);
    },
    /**更新视图模块位置，根据开始模块位置，调整所有模块的位置*/
    update: function() {
      var vx_ = flow.view._needMoveX;
      var vy_ = flow.view._needMoveY;
      flow.view._needMoveX = 0;
      flow.view._needMoveY = 0;
      flow.log("更新视图:" + vx_ + "  " + vy_);
      var root = _data,
      i, j;
      if (root.length <= 0) {
        return false;
      }
      for (i = 0; i < root.length; i++) {
        if ($.isArray(root[i]) && root[i].length > 0) {
          for (j = 0; j < root[i].length; j++) {
            root[i][j].updateSize();
          }
        } else if (root[i].updateSize) {
          root[i].updateSize();
        }
      }
      var x = 0;
      var y = 0;
      if (root[0].isBlock) {
        x = root[0].x + vx_;
        y = root[0].y + vy_;
      }
      for (i = 0; i < root.length; i++) {
        if ($.isArray(root[i]) && root[i].length > 0) {
          x = root[i][0].x + vx_;
          y = root[i][0].y + vy_;
          for (j = 0; j < root[i].length; j++) {
            root[i][j].updatePosition(x, y);
            y += root[i][j].allheight;
          }
          if (flow.view._needMoveX > 0 || flow.view._needMoveY > 0) {
            root[i][0].x += flow.view._needMoveX;
            root[i][0].y += flow.view._needMoveY;
            flow.view._needMoveX = 0;
            flow.view._needMoveY = 0;
            i--;
          }

        } else if (root[i].updatePosition) {
          root[i].updatePosition(x, y);
          y += root[i].allheight;
        }
      }
      var array = flow.view._needUpdateArray;
      var obj = array.pop();
      while (obj) {
        obj.divUpdate();
        obj = array.pop();
      }
    },
    /*在line上插入block元素*/
    dropBlockTo: function(block, div) {
      if (block.attr("blockid")) {
        /*移动block元素到div位置*/
        block = flow.getBlockById([block.attr("blockid")]);
        var newPs = flow.getBlockById($(div).attr("blockid"));
        if (!newPs) {
          flow.addError("flow.view.dropBlockTo拖动到未知元素上了:" + div);
          return;
        }
        if (block.type === "start" || block.type === "end" || block.type === "note") {
          alert("该节点不能被拖动到其他节点上!");
          return;
        }
        var oldPlace = block.getPath();
        var data = block.getData();
        flow.delete(block);
        block = flow.addObj(data);
        block.insertAfter(newPs);
        newPs = block.getPath();
        _action.changePlace(data, newPs, oldPlace);
        flow.view.update();
      } else {
        /*拖动已经初始化的元素到其他节点上*/
        var type = $(block).attr("blocktype");
        if (type === "start" || type === "note" || type === "end") {
          alert("该节点不能被拖动到其他节点上");
          return false;
        }
        block = flow.addBlock($(block).attr("blocktype"));
        block.insertAfter(flow.getBlockById(div.attr("blockid")));
        flow.view.update();
        flow.view.changeChoosed(block);
        _action.addBlock(block.getData(), block.getPath());
      }
    },
    changeLatestDrop: function(type) {
      flow.view._latestDrop = type;
    },
    /*block文字发生改变*/
    changeTextEvent: function(block, text) {
      /*flow.log("changeTextEvent:%o :%s",block,text);*/
      _action.changeText(block.getPath(), block.text, text);
      block.text = text;
    },
    /*当停止拖动元素*/
    onStopDrag: function(e, n) {
      var toObject = $(e.toElement);
      flow.log("stopdrag:" + flow.view._latestDrop);
      flow.log(e);
      var target = $(e.target);
      var type = target.attr("blocktype");
      var block;
      if (flow.view._latestDrop === "view") {
        flow.log("latestDrop: view");
        if (type !== "start" && type !== "note") {
          return true;
        }
        if (e.toElement && e.toElement.innerText !== e.target.innerText) {
          //防止拖动超出范围
          return true;
        }
        var viewPs = $("#" + _setting.viewId).position();
        var newPs = {
          "x": e.pageX - viewPs.left - e.offsetX,
          "y": e.pageY - viewPs.top - e.offsetY
        };
        if (target.attr("blockid")) {
          //移动生成后的元素
          block = flow.getBlockById(target.attr("blockid"));
          if (!block) {
            return;
          }
          _action.changePosition(block.getPath(), newPs, {
            "x": block.x,
            "y": block.y
          });
          block.updatePosition(newPs.x, newPs.y);
        } else {
          var blocks = [];
          block = flow.addBlock(type, {
            x: e.pageX - viewPs.left - e.offsetX,
            y: e.pageY - viewPs.top - e.offsetY
          });
          blocks.push(block);
          block.parent = blocks;
          if (type === "start") {
            var block2 = flow.addBlock("end");
            block2.insertAfter(block);
          }
          _data.push(blocks);
          _action.addBlock(flow.getData(blocks), (_data.length - 1) + "");
        }
        flow.view.update();
      }
    },
    /**根据路径取得节点*/
    getBlockByPath: function(path) {
      if (!path) {
        return;
      }
      var paths = path.split(".");
      var now = _data;
      for (var i = 0; i < paths.length; i++) {
        now = now[paths[i]];
        if (!now) {
          return null;
        }
        if (i === paths.length - 1) {
          return now;
        }
      }
      return null;
    },
    /**根据路径添加节点*/
    insertBlockByPath: function(block, path) {
      if (!block || !path) {
        return false;
      }
      var paths = path.split(".");
      var now = _data;
      var lastaction = paths[paths.length - 1];
      for (var i = 0; i < paths.length - 1; i++) {
        now = now[paths[i]];
        if (!now) {
          flow.addError("flow.view.insertBlockByPath添加节点错误" + path, block)
        }
      }
      if (now) {
        block.parent = now;
        if (parseInt(lastaction) >= 0) {
          now.splice(parseInt(lastaction), 0, block);
        }
      }
    },
    /**删除当前选中节点*/
    deleteChoosed: function() {
      var blockid = $(".choosed").attr("blockid");
      var block = flow.getBlockById(blockid);
      if (!block) {
        return;
      }
      if (block.type === "start" || block.type === "end") {
        if (!confirm("删除该节点会将整条连线全部删除，确认删除整条连线？")) {
          return;
        }
        flow.log("删除整条连线！");
        var path = block.getPath();
        path = path.substring(0, path.indexOf("."));
        block = flow.view.getBlockByPath(path);
        var data = flow.getData(block);
        flow.delete(block);
        _action.delete(data, path);
      } else {
        _action.delete(block.getData(), block.getPath());
        block.delete();
        flow.view.update();
      }
    },
    /**更改当前选中的元素*/
    changeChoosed: function(obj) {
      $(".choosed").removeClass("choosed");
      $(".hovered").removeClass("hovered");
      if (!obj) {
        return null;
      }
      if ($.isArray(obj)) {
        obj = obj[0];
      }
      var block = null;
      if (obj.isBlock) {
        block = obj;
        obj = $("[blockid=" + block.blockid + "]");
      } else {
        block = flow.getBlockById(obj.attr("blockid"));
      }
      flow.log("选中元素");
      flow.log(obj);
      flow.log(block);
      obj.addClass("choosed");
      if (block) {
        var input = block.getInput();
        if (input) {
          input.focus();
        }
        var path = block.getPath();
        var start = flow.view.getBlockByPath(path.substring(0, path.indexOf(".")) + ".0");
        flow.log(start);
        if (start.type === "start") {
          $(".selected").removeClass("selected");
          start.divObject.addClass("selected");
        }
      }
      return obj;
    }
  };

  flow.getChoosed = function() {
    var blockid = $("choosed").attr("blockid");
    return flow.getBlockById(blockid);
  }
  flow.update = flow.view.update;
  flow.changeChoosed = flow.view.changeChoosed;
  flow.deleteChoosed = flow.view.deleteChoosed;
  flow.getBlockByPath = flow.view.getBlockByPath;

  /**取得程序开始节点*/
  flow.getStartBlock = function(){
    var startId = $(".selected").attr("blockid");
    return flow.getBlockById(startId);
  }
  /**取得生成的代码*/
  flow.getCode = function() {
    var code = "";
    var startId = $(".selected").attr("blockid");
    var block = flow.getBlockById(startId);
    if (block) {
      var p = block.parent;
      for (var i = 0; i < p.length; i++) {
        code += p[i].getCode();
      }
    }
    if(flow.exec && flow.exec.getVariable){
      return flow.exec.getVariable(code)+code;
    }
    return code;
  }

  /*操作记录*/
  var _action = {
    actionList: [],
    flag: 0,
    add: function(name, key) {
      if (!name) {
        return;
      }
      var actions = _action.actionList;
      actions.splice(_action.flag, actions.length - _action.flag); //删除多余的动作
      if (name !== "changeText") {
        actions.push({
          "name": name,
          "key": key
        });
      } else {

        var last = actions[actions.length - 1];
        if (last && last.name === "changeText" && last.key.path === key.path) {
          key.bak = last.key.bak;
          _action.flag -= 1;
          actions.splice(actions.length - 1, 1);
        }
        actions.push({
          "name": name,
          "key": key
        });
      }
      flow.fire(name);
      _action.flag += 1;
      flow.log("add history: " + name + " %o", key);
    },
    /*初始化图像*/
    init: function(str) {
      _action.add("init", str);
    },
    init_redo: function(obj) {
      flow.deleteAll();
      _data = flow.addObj(obj);
      flow.view.update();
    },
    init_undo: function(obj) {
      flow.deleteAll();
      flow.view.update();
    },
    /*再次初始化*/
    reinit: function(bak, newStr) {
      _action.add("reinit", {
        'bak': bak,
        'new': newStr
      });
    },
    reinit_redo: function(obj) {
      flow.deleteAll();
      _data = flow.addObj(obj.new);
      flow.view.update(true);
    },
    reinit_undo: function(obj) {
      flow.deleteAll();
      _data = obj.bak;
      flow.view.update(true);
    },
    /*添加节点*/
    addBlock: function(data, path) {
      _action.add("addBlock", {
        'data': data,
        'path': path
      });
    },
    addBlock_redo: function(b) {
      var block = flow.addObj(b.data);
      flow.view.insertBlockByPath(block, b.path);
      flow.view.update(true);
      flow.view.changeChoosed(block);
    },
    addBlock_undo: function(b) {
      var block = flow.view.getBlockByPath(b.path);
      flow.delete(block);
      flow.view.update(true);
    },
    delete: function(data, path) {
      _action.add("delete", {
        'data': data,
        'path': path
      });
    },
    delete_redo: function(b) {
      var block = flow.view.getBlockByPath(b.path);
      flow.deleteAll(block);
      flow.view.update(true);
    },
    delete_undo: function(b) {
      var block = flow.addObj(b.data);
      flow.view.insertBlockByPath(block, b.path);
      flow.view.update(true);
      flow.view.changeChoosed(block);
    },
    /*更改模块位置*/
    changePlace: function(data, path, bak) {
      _action.add('changePlace', {
        "data": data,
        "path": path,
        "bak": bak
      });
    },
    changePlace_undo: function(info) {
      var obj = flow.view.getBlockByPath(info.path);
      flow.delete(obj);
      obj = flow.addObj(info.data);
      flow.view.insertBlockByPath(obj, info.bak);
      flow.view.update();
      flow.view.changeChoosed(obj);
    },
    changePlace_redo: function(info) {
      var obj = flow.view.getBlockByPath(info.bak);
      flow.delete(obj);
      obj = flow.addObj(info.data);
      flow.view.insertBlockByPath(obj, info.path);
      flow.view.update();
      flow.view.changeChoosed(obj);
    },
    changePosition: function(path, newPs, bak) {
      _action.add("changePosition", {
        "path": path,
        "new": newPs,
        "bak": bak
      });
    },
    changePosition_undo: function(info) {
      var block = flow.view.getBlockByPath(info.path);
      block.updatePosition(info.bak.x, info.bak.y);
      flow.view.update();
      flow.view.changeChoosed(block);
    },
    changePosition_redo: function(info) {
      var block = flow.view.getBlockByPath(info.path);
      block.updatePosition(info.new.x, info.new.y);
      flow.view.update();
      flow.view.changeChoosed(block);
    },
    changeText: function(path, oldText, newText) {
      _action.add("changeText", {
        "path": path,
        "new": newText,
        "bak": oldText
      });
    },
    changeText_undo: function(info) {
      var block = flow.view.getBlockByPath(info.path);
      block.changeText(info.bak);
      flow.view.changeChoosed(block);
    },
    changeText_redo: function(info) {
      var block = flow.view.getBlockByPath(info.path);
      block.changeText(info.new);
      flow.view.changeChoosed(block);
    }
  };
  /**#flow.history 操作历史*/
  flow.history = {
    /**重做操作*/
    redo: function() {
      if (_action.flag >= _action.actionList.length) {
        return false;
      }
      var action = _action.actionList[_action.flag];
      if (!action) {
        return false;
      }
      if (action.name && _action[action.name + "_redo"]) {
        _action[action.name + "_redo"](action.key);
      }
      flow.fire(action.name);
      _action.flag += 1;
    },
    /**撤销操作*/
    undo: function() {
      if (_action.flag <= 0) {
        return false;
      }
      _action.flag -= 1;
      var action = _action.actionList[_action.flag];
      if (!action) {
        return false;
      }
      if (action.name && _action[action.name + "_redo"]) {
        _action[action.name + "_undo"](action.key);
      }
    },
    /**能否重做*/
    canRedo: function() {
      if (_action.flag >= _action.actionList.length) {
        return false;
      }
      var action = _action.actionList[_action.flag];
      if (!action) {
        return false;
      }
      return true;
    },
    /**能否撤销*/
    canUndo: function() {
      if (_action.flag <= 0) {
        return false;
      }
      var action = _action.actionList[_action.flag];
      if (!action) {
        return false;
      }
      return true;
    },
    /**取得重做操作名称*/
    getRedo: function() {
      if (_action.flag >= _action.actionList.length) {
        return null;
      }
      var action = _action.actionList[_action.flag];
      if (!action) {
        return null;
      }
      return action.name;
    },
    /**取得撤销操作名称*/
    getUndo: function() {
      if (_action.flag <= 0) {
        return null;
      }
      var action = _action.actionList[_action.flag];
      if (!action) {
        return null;
      }
      return action.name;
    }
  };

  /**#错误处理*/
  flow._error = [];
  /**添加错误*/
  flow.addError = function(msg, obj) {
    flow._error.push({
      "msg": msg,
      "obj": obj
    });
    if (obj) {
      flow.view.changeChoosed(obj);
    }
    alert(msg);
  };

  flow.debug = {};

  window.flow = flow;

  /**为flow添加函数
   name:函数名称
   func:函数
  */
  flow.extend = function(name,func){
    if(!name || !func){
      return false;
    }
    if(flow[name]){
      return false;
    }
    flow[name] = func;
  }

  /**添加节点属性或操作函数，函数内this代表block
    注意：节点可能是block或者连线或辅助线assistLine
  */
  flow.extend2block = function(name,func){
    if(!name || !func){
      return false;
    }
    Block.prototype[name] = func;
  }


  /**#代码执行部分exec*/
  var exec = {};
  /**代码中的关键字*/
  exec.keys = "var,if,do,break,continue,for,while,print,true,false";
  /**获取到的变量列表object类型*/
  exec.vars = {};
  /*取得所有要定义的变量*/
  exec.getVariable = function(code) {
    var vars = code.match(/(\w+)/g);
    var keys = exec.keys.split(",");
    for (var i = vars.length - 1; i >= 0; i--) {
      for (var j = keys.length - 1; j >= 0; j--) {
        if (keys[j] === vars[i]) {
          vars.splice(i, 1);
        } else if ($.isNumeric(vars[i])) {
          vars.splice(i, 1);
        }
      }
    }
    exec.vars = {};
    for (i = 0; i < vars.length; i++) {
      exec.vars[vars[i]] = 0.0;
    }
    code = ' ' + code;
    code = code.replace(/([^\w]+)(var\s+)/g, "$1"); //删除多余的var
    var varDefine = 'var ';
    for (i in exec.vars) {
      varDefine += i + " = 0.0,"
    }
    varDefine += ";\n";
    varDefine = varDefine.replace(",;", ";");
    return varDefine;
  }
  /**执行程序中的print函数*/
  exec.print = function(msg){
    flow.log(msg);
  }
  /**执行程序中的输入函数*/
  exec.input = function(msg){
    return 1;
  }
  flow.exec = exec;


  /**#调试debug*/
  var debug = {};
  /**调试时变量列表object*/
  debug.vars = {};
  /**调试时当前的模块*/
  debug.nowblock = null;
  /**将代码中的变量，替换成调试时变量*/
  debug.replaceVars = function(code){
    code = " "+code;
    for(var i in debug.vars){
      var reg = new RegExp("[^\\w\\.]("+i+")[^\\w\\.]");
      code = code.replace(reg,function(a,b){
        return a.replace(b,"flow.debug.vars."+b);
      });
    }
    return code;
  }
  /**开始调试*/
  debug.start = function(){
    debug.vars = null;
    var code = flow.getCode();
    debug.vars = exec.vars;
    debug.nowblock = flow.getStartBlock();
    flow.view.changeChoosed(debug.nowblock);
    return debug.nowblock;
  }
  debug.next = function(){
    var block = debug.nowblock;
    var next = null;
    var code = "";
    switch(block.type){
      case "exec":
        var code = block.getCode();
        code = debug.replaceVars(code);
        debug.exec(code);
        next = block.getNext();
        break;
      case "select":
      case "loop":
        code = block.getText();
        code = debug.replaceVars(code);
        if(debug.exec(code)){
          next = block.down[0];
        }else if(block.right){
          next = block.right[0];
        }else{
          next = block.getNext();
        }
        break;
      case "start":
      default:
        next = block.getNext();
    }
    if(next && next.type === "loop"){
      if(next.up.length > 0){
        next = next.up[0];
      }
    }
    while(!next){
      var p = block.getBeloneBlock();
      if(p){
        var branch = block.getBranchName();
        if(branch === "up"){
          next = p;
        }else if(branch === "down" && p.type === "loop"){
          next = p.up[0];
        }else{
          next = p.getNext();
        }
      }else{
        break;
      }
    }
    debug.nowblock = next;
    flow.view.changeChoosed(debug.nowblock);
    return debug.nowblock;
  }
  /**执行代码*/
  debug.exec = function(code){
    flow.log("exec:"+code);
    return eval(code);
  }


  flow.debug = debug;
})(window, jQuery);
