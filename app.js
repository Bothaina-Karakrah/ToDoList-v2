//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

//use bodyparser to get the data from the list.ejs
app.use(bodyParser.urlencoded({
  extended: true
}));

//this will include css, or the static files
app.use(express.static("public"));

//insert mongoose to the projects so we will have dataBase
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});

//the item object
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Hit the + button to add a new item."
});

const item2 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2];

//this will allow creating new list as the custom needs
//the list object, it contain items list
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//render the root page
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    //check if the list is empty, if yes add the defaultItems
    //this will solve the problem of adding the defaultItems to the list each restart
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
//end of item find
});
//end of get("/")

//this we help the custom to add list as he want
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  //if list doesn't exist add one
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new customList
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //if the list exist, show it.
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
  //end of findOne
});
//end of get for customList

//this will insert the new item when we submit the form
app.post("/", function(req, res) {

  //get the new item, and the list name so we can add to it.
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  //if we in the root page, add the item to the root list
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    //else, find the list and add the item to it.
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//delete the item when we click the checkbox
app.post("/delete", function(req, res) {

  //get the id of the item that checked, and the list so we can delete the item.
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  //if the list is the root one then find the item by it's id and delete it
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //else, we have to find the specified list and then remove the item from it.
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

//our app list at port 3,000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
