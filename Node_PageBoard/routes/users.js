// routes/users.js

let express = require('express');
let router = express.Router();
let User = require('../models/User');
let util = require('../util'); // 1

// New
router.get('/new', function(req, res){
    let user = req.flash('user')[0] || {};
    let errors = req.flash('errors')[0] || {};
    res.render('users/new', { user:user, errors:errors });
});

// create
router.post('/', function(req, res){
    User.create(req.body, function(err, user){
        if(err){
            req.flash('user', req.body);
            req.flash('errors', util.parseError(err)); // 1
            return res.redirect('/users/new');
        }
        res.redirect('/');
    });
});

// show
router.get('/:username', util.isLoggedin, checkPermission, function(req, res){
    User.findOne({username:req.params.username}, function(err, user){
        if(err) return res.json(err);
            res.render('users/show', {user:user});
    });
});

// edit
router.get('/:username/edit', util.isLoggedin, checkPermission, function(req, res){
    let user = req.flash('user')[0];
    let errors = req.flash('errors')[0] || {};
    if(!user){
        User.findOne({username:req.params.username}, function(err, user){
            if(err) return res.json(err);
                res.render('users/edit', { username:req.params.username, user:user, errors:errors });
        });
    }
    else {
        res.render('users/edit', { username:req.params.username, user:user, errors:errors });
    }
});

// update
router.put('/:username', util.isLoggedin, checkPermission, function(req, res, next){
    User.findOne({username:req.params.username})
        .select('password')
        .exec(function(err, user){
            if(err) return res.json(err);
    
            // update user object
            user.originalPassword = user.password;
            user.password = req.body.newPassword? req.body.newPassword : user.password;
            for(var p in req.body) {
                user[p] = req.body[p];
            }
    
            // save updated user
            user.save(function(err, user){
            if(err){
                req.flash('user', req.body);
                req.flash('errors', parseError(err));
                return res.redirect('/users/'+req.params.username+'/edit'); // 1
            }
            res.redirect('/users/'+user.username);
            });
        });
    });

module.exports = router;

// private functions // 2
function checkPermission(req, res, next){
    User.findOne({username:req.params.username}, function(err, user){
        if(err) return res.json(err);
        if(user.id != req.user.id) return util.noPermission(req, res);
    
        next();
    });
}