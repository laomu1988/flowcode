background(170,170,170);
size(200,300);
strokeWeight(2);
smooth();
stroke(0);
//noFill();

int bw = 100,bh = 40;//模块宽度，高度
int px,py;
int jw = 3,jh = 5;//箭头宽度，高度

//矩形
noFill();
rect(50,20,100,40);

//菱形 100,80
fill(0,158,232);
quad(100,80,150,100,100,120,50,100);


//竖直线及箭头 100,120
px = 100;
py = 120;
line(px,py,px,py + 40);
line(px,py+40,px-jw,py+40-jh);
line(px,py+40,px+jw,py+40-jh);


//水平线50 160
line(50,180,150,180);

//竖直线及箭头 加右侧半截横线
px = 100;
py = 200;
line(px,py,px,py + 40);//竖线
line(px,py+40,px-jw,py+40-jh);//箭头左
line(px,py+40,px+jw,py+40-jh);//箭头右
line(px,py+bh/2,px+bw/2,py+bh/2);//右侧横线
line(px,py+28,px-jw,py+28-jh);//箭头左
line(px,py+28,px+jw,py+28-jh);//箭头右


save("block-bg.png");//block-background



