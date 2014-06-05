/**
画辅助线
*/
int bw = 100,bh = 40;//模块宽度，高度
int weight = 2;//线条粗细
background(170,170,170);
strokeWeight(weight);
smooth();
stroke(0);
noFill();
size(bw,bh);

line(bw/2,0,bw/2,bh);
save("assist-vline.png");//竖线

background(170,170,170);
line(0,bh/2,bw,bh/2);
save("assist-hline.png");//横线
