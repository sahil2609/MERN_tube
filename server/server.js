const express = require('express')
const mongoose = require('mongoose'); 
const bodyParser= require('body-parser')
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const markdown = require('marked');
const app = express();
const sanitizeHTML = require('sanitize-html');
const userRoutes =  require("./routes/user.routes");
const mediaRoutes = require("./routes/media.routes");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const compress = require('compression')

dotenv.config();
const http = require('http').createServer(app)
const server = http.listen(4000, () => {
    console.log('server is running on port', server.address().port);
});

mongoose.connect(
    process.env.MONG_URL,
    { useNewUrlParser: true, useUnifiedTopology: true}, (err) =>{
      console.log("Connected to MongoDB", err);
    }
);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With,X-HTTP-Method-Override, Content, Accept, Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    next();
  });

app.use('/stylesheets/fontawesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/'));
app.use(function(req, res, next){


    res.locals.filterUserHTML = function(content){
      return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }
  
    //make current user id available on the req object
    // console.log(io);
    next()
})

app.use(express.static('public'));
const corsOptions = {
  origin: ["http://localhost:3000"],
 //update: or "origin: true," if you don't wanna add a specific one
  credentials: true,
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(compress())
app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});  
app.use('/', userRoutes)
app.use('/', mediaRoutes)