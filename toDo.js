// jshint esversion:7

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/toDoListDB", { useNewUrlParser: true });

const itemsSchema={
        name: String
};

const Item = new mongoose.model("Items", itemsSchema);

const item1 = new Item(
    {
        Name: "Welcome to your toDoList"
    });

const item2 = new Item(
    {
        Name: "Hit + button to add the items"
    });

const item3 = new Item(
    {
        Name: "<-- Hit this button to delete this item"
    });

const defaultItems = [item1, item2, item3];

const listSchema =
    {
        name: String,
        items: [itemsSchema]
    };

const List = new mongoose.model("List", listSchema);



app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {

            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("Successfully submitted item");
                }
            });
            res.redirect("/");
        }
        else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //    creating a new list
                const list = new List(
                    {
                        name: customListName,
                        items: defaultItems
                    }
                );
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                //    showing an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
});


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
            name: itemName
        });

    if (listName === "Today") {
        item.save();
        res.redirect("/");}
    else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });}
});


app.post("/delete", function (req, res) {
    const checkId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName==="Today")
    {
        Item.findByIdAndRemove(checkId, function (err) {
        if (!err) {
            console.log("Successfully deleted");
            res.redirect("/");} 
      });}
    else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkId}} },function(err, foundList)
        {
            if(!err)
            {
                res.redirect("/"+ listName);
            }
        });
    }

});



app.listen(3000, function () {
    console.log("Server is running at port");
});