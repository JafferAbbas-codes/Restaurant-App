const express = require("express");
const bodyParser = require("body-parser");
const Dishes = require("../models/dishes");
const Favorites = require("../models/favorites");
const User = require("../models/user");
const authenticate = require("../authenticate");
const e = require("express");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .get(authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        //console.log(favorite.dishes);
        //console.log(!favorite.user);
        res.json(favorite);
      });
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        }
        //console.log(favorite);
        if (!req.body.dishes) {
          err = new Error("Please provide a list of dishes in the body");
          err.status = 400;
          return next(err);
        } else if (!favorite.user) {
          req.body.dishes.map((dish) => {
            Dishes.findById(dish._id).exec((err, dish) => {
              if (err) {
                err = new Error('The Dish "' + dish._id + '" was not found');
                err.status = 404;
                return next(err);
              }
            });
            fav = {
              dishes: req.body.dishes,
              user: req.user,
            };
            Favorites.create(fav)
              .then(
                (fav) => {
                  //console.log("Favorite Created and Dishes Added!", fav);
                  res.statusCode = 200;
                  res.setHeader("Content-type", "application/json");
                  res.json(fav);
                },
                (err) => next(err)
              )
              .catch((err) => next(err));
          });
        } else if (
          JSON.stringify(req.body.dishes) === JSON.stringify(favorite.dishes)
        ) {
          console.log(JSON.stringify(req.body.dishes));
          console.log(JSON.stringify(favorite.dishes));
          err = new Error("This array already exist in your favorites");
          err.status = 403;
          return next(err);
        } else {
          Favorites.findByIdAndUpdate(
            favorite._id,
            {
              $set: { dishes: req.body.dishes },
            },
            { new: true }
          )
            .populate("user")
            .populate("dishes")
            .exec((err, favorites) => {
              if (err) {
                err.status = 400;
                return next(err);
              } else {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json({
                  message: "Successfully added all dishes!",
                  favorites,
                });
              }
            });
        }
      });
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user }).exec((err, favorite) => {
      if (err) {
        err.status = 400;
        return next(err);
      } else {
        if (!favorite) {
          res.statusCode = 400;
          res.end({
            message: "Your favorites dishes list is already empty!",
            favorite,
          });
        } else {
          favorite.remove();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json({ message: "Successfully deleted all dishes!", favorite });
        }
      }
    });
  });

favoriteRouter
  .route("/:dishId")
  .get(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("GET operation not supported on /favorites/:dishId");
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        } else if (!req.params.dishId) {
          err = new Error("Please provide a dish in the params");
          err.status = 400;
          return next(err);
        } else if (!favorite) {
          Dishes.findById(req.params.dishId).exec((err, dish) => {
            if (err) {
              return next(err);
            } else if (!dish) {
              err = new Error('The Dish "' + dish._id + '" was not found');
              err.status = 404;
              return next(err);
            } else {
              fav = {
                dishes: dish,
                user: req.user,
              };
              Favorites.create(fav)
                .then(
                  (fav) => {
                    //console.log("Favorite Created and Dishes Added!", fav);
                    res.statusCode = 200;
                    res.setHeader("Content-type", "application/json");
                    res.json(fav);
                  },
                  (err) => next(err)
                )
                .catch((err) => next(err));
            }
          });
        } else {
          Dishes.findById(req.params.dishId).exec((err, dish) => {
            if (err || !dish) {
              err = new Error("Dish not found");
              err.status = 404;
              return next(err);
            }
            //console.log("FAVORITE DISHES " + favorite);
            //console.log("Dish found " + dish)
            var num = 0;
            favorite.dishes.map((favdish, i) => {
              if (JSON.stringify(dish._id) == JSON.stringify(favdish._id)) {
                num++;
              }
              console.log(i);
            });
            if (num > 0) {
              err = new Error("Dish already exists in your favorites");
              err.status = 400;
              return next(err);
            }
            favorite.dishes.push(dish);
            favorite.save();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              message: "Successfully added the dish!",
              favorite,
            });
          });
        }
      });
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites/:dishId");
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    if (!req.params.dishId) {
      err = new Error("Please provide a dish in the params");
      err.status = 400;
      return next(err);
    }
    Favorites.findOne({ user: req.user })
      .populate("dishes")
      .populate("user")
      .exec((err, favorite) => {
        if (err) {
          err.status = 400;
          return next(err);
        }
        if (!favorite) {
          err = new Error("You have no dishes in your favorites");
          err.status = 400;
          return next(err);
        } else {
          Dishes.findById(req.params.dishId).exec((err, dish) => {
            if (err || !dish) {
              err = new Error("Dish not found");
              err.status = 404;
              return next(err);
            }
            //console.log("FAVORITE DISHES " + favorite);
            //console.log("Dish found " + dish)
            var num = -1;
            favorite.dishes.map((favdish, i) => {
              if (JSON.stringify(dish._id) == JSON.stringify(favdish._id)) {
                num++;
                favorite.dishes.splice(i);
              }
            });
            if (num == -1) {
              err = new Error("This Dish doesnot exist in your favorites");
              err.status = 404;
              return next(err);
            } else {
              favorite.save();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json({
                message: "Successfully deleted the dish!",
                favorite,
              });
            }
          });
        }
      });
  });

module.exports = favoriteRouter;

// favorite.dishes.map((favdish) => {
//   req.body.dishes.map((dish)=>{
//     if (favdish._id == dish._id) {
//       err = new Error("Dish already exists in your favorites");
//       err.status = 400;
//       return next(err);
//     }
//   })
// })
