Create Database Gamestore;
Create Table User(
userID int auto_increment not null,
First_Name varchar(255) not null,
Last_Name varchar(255) not null,
Email varchar(255) not null,
Password varchar(50) not null,
Phone int(7) not null,
Address varchar(255),
Primary Key(userID)
);
Create Table Products(
pID int auto_increment not null,
Product_Name varchar(255) not null,
Brand varchar(255) not null,
Price decimal(7,2) not null,
Description varchar(1000) not null,
Category varchar(255) not null,
Image longblob,
Primary Key(pID)
);
Create table orders(
Order_ID int not null auto_increment,
Order_Cost decimal(7,2),
Order_Status varchar(100),
userId int(11),
First_Name varchar(255) not null,
Last_Name varchar(255) not null,
Email varchar(255) not null,
Address varchar(400),
Phone_No varchar(10),
Order_Date datetime not null DEFAULT CURRENT_TIMESTAMP,
primary key(Order_ID)
);
Create table order_items(
Item_ID int not null auto_increment,
Order_ID int(11),
pID int,
Product_Name varchar(255),
Image varchar(50),
Price decimal(7,2),
userId int(11),
Quantity int,
First_Name varchar(255),
Last_Name varchar(255),
Order_Date datetime,
primary key(Item_ID)
);


Alter table products modify column Image longblob not null;
Alter table products add Quantity int;
Alter table products add Image2 longblob not null;
Alter table products add Image3 longblob not null;
Alter table products add Image4 longblob not null;


Drop table user;
ALTER TABLE User MODIFY COLUMN Password VARCHAR(255);
