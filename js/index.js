/*主页*/
(function($){

  /*修改左侧和右侧部分高度*/
  function OnResize(){
    var height = $(".main").height();
    var bottomHeight = $(".bottom").height();
    $(".main-left").css("height",height-bottomHeight);
    $(".main-right").css("height",height-bottomHeight);
    $(".main-middle").css({"height":height-bottomHeight});
  }

  $(function(){
    OnResize();
    $(window).resize(function(){
      OnResize();
    });

    //通过拖动右侧.vline修改右侧宽度
    var isMoving = false;
    var startX = 0;
    var rightWidth = 0;
    $(".main-right .vline").bind("mousedown",function(e){
      isMoving = true;
      startX = e.pageX;
      rightWidth = $(".main-right").width();
      console.log(e);
    });
    $("body").bind("mousemove mouseup",function(e){
      if(!isMoving){
        return;
      }
      if(e.type === "mouseup"){
        isMoving = false;
        return;
      }
      var newX = e.pageX;
      rightWidth = rightWidth + startX - newX;
      startX = newX;
      if(rightWidth<100){
        rightWidth = 100;
      }else{
        var maxWidth =  $(".main").width()-300;
        if(maxWidth<rightWidth){
          rightWidth = maxWidth;
        }
      }
      $(".main-middle").css({"right":rightWidth});
      $(".main-right").width(rightWidth);
    });

  });

})(jQuery);
