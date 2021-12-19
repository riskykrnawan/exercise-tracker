require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
ObjectId = require('mongodb').ObjectID;

const app = express()

app.use(bodyParser.urlencoded({ extended: true }));

//connect to database
mongoose.connect(
  process.env.MONGO_URI, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

//user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String, 
    required: true, 
  },
  exercices: [{
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      default: new Date().toISOString().slice(0, 10),
    },
    _id: false,
  }]
})

//user model
const User = new mongoose.model('User', userSchema);


// 1. You can POST to /api/users with form data username to create a new user.
// 2. The returned response from POST /api/users with form data username will be an object with username and _id properties.
// 3. You can make a GET request to /api/users to get a list of all users.
// 4. The GET request to /api/users returns an array.
// 5. Each element in the array returned from GET /api/users is an object literal containing a user's username and _id.

app.post("/api/users", (req, res) => {
  const user = new User({ username: req.body.username });
  user.save((err) => {
    if (err) return console.log(err);
  });
  res.json({ 
    username: user.username,
    _id: user._id, 
  });
})

app.get("/api/users", (req, res) => {
  User.find()
    .select("username _id")
    .exec((err, userList) => {
      if (err) {
        return console.log(err)
      }
      res.json(userList)
    })
});


// 6. You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
// 7. The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;

  const newExercise = {
    description: req.body.description,
    duration: +req.body.duration,
    date: req.body.date
  }

  User.findByIdAndUpdate(userId, {$push: { exercices: newExercise } },
    {new: true}, (err, foundUser) => {
    if (err) return console.log(err);

    let returnObj = {
      _id: userId,
      username: foundUser.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString()
    };

    res.json(returnObj);
  });

});


// 8. A GET request to /api/users/:id/logs will return the user object with a log array of all the exercises added.
// 9. Each item in the log array that is returned from GET /api/users/:id/logs is an object that should have a description, duration, and date properties.
// 10. The description property of any object in the log array that is returned from GET /api/users/:id/logs should be a string.
// 11. The duration property of any object in the log array that is returned from GET /api/users/:id/logs should be a number.
// 12. The date property of any object in the log array that is returned from GET /api/users/:id/logs should be a string.. Use the dateString format of the Date API.

app.get("/api/users/:_id/logs", (req, res) => {
  let userId = req.params._id;
  let dFrom = req.query.from || '0000-00-00';
  let dTo = req.query.to || '9999-99-99';
  let limit = +req.query.limit || 999;

  User.findById(userId, function (err, user) {
    if (err) return console.log(err);
    let newLog = user.exercices.filter(res => res.date >= dFrom && res.date <= dTo)
      .map(result => (
        {
          description: result.description, 
          duration: result.duration, 
          date: result.date
        }
      ))
      .slice(0,limit);
    
    let logObj = {
      _id: userId,
      username: user.username,
      count: newLog.length,
      log: newLog
    };
    res.json(logObj);
  });
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
