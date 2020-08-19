const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database
mongoose.connect(
  "mongodb+srv://admin-abdumalik:Test123@cluster0.ejdox.mongodb.net/todolistDB",
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }
);
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = new mongoose.model("Item", itemsSchema);
const defaultItems = [];
const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});
defaultItems.push(item1, item2, item3);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = new mongoose.model("List", listSchema);

// Main Function
app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${customListName}`);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (itemName !== "") {
    const item = new Item({
      name: itemName,
    });
    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName }, (err, foundList) => {
        if (!err) {
          foundList.items.push(item);
          foundList.save();
          res.redirect(`/${listName}`);
        }
      });
    }
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listTitle;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted checked todolist item");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => console.log("Server is running on port 3000"));
