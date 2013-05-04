
/*
 * GET home page.
 */
exports.init = function(orient, callback) {
    module.db = orient;
    ensureSchemaIsSetup(callback);
};

exports.index = function(req, res){
		req.session.name = req.session.name ? req.session.name : "visitor"+Math.floor(Math.random()*1000000);
    module.db.command("select from Post order by creation_date desc", { fetchPlan: "*:2" }, function(err, posts) {
        res.render('index', {
            title: 'Express + OrientDB blog',
            posts: posts,
            sess: req.session.id,
            name: req.session.name
        });
    });
};

exports.new_post_form = function(req, res) {
    res.render("new_post", { title: "New post" });
};

exports.new_post = function(req, res, next) {

    function fetchOrCreateTag(tagName, callback) {
        tagName = tagName.trim();
        
        module.db.command("select from Tag where name = '" + tagName + "'", function(err, results) {
            if (err) return callback(err);

            if (results.length === 0) {
                module.db.createVertex({ name: tagName }, { "class": "Tag" }, function(err, tagVertex) {
                    callback(null, tagVertex);
                });
            } else {
                callback(null, results[0]);
            }
        });
    }

    function fetchTagVertexes(callback) {
        if (!req.body.tags || req.body.tags.trim() === "") {
            callback(null, []);
            return;
        }
        var tagStrings = req.body.tags.trim().split(",");
        var tagsAccumulator = [];
        for (var idx = 0; idx < tagStrings.length; idx++) {
            fetchOrCreateTag(tagStrings[idx], function(err, tagVertex) {
                if (err) return callback(err);

                tagsAccumulator.push(tagVertex);

                if (tagStrings.length === tagsAccumulator.length) {
                    callback(null, tagsAccumulator);
                }
            });
        }
    }

    fetchTagVertexes(function(err, tags) {
        if (err) return next(err);

        var post = {
            title: req.body.title,
            text: req.body.text,
            creation_date: new Date()
        };

        module.db.createVertex(post, { "class": "Post" }, function(err, post) {
            if (err) return next(err);

            if (tags.length === 0) {
                res.redirect("/");
                return;
            }

            for (var idx = 0; idx < tags.length; idx++) {
            		//createEdge - sourceHashOrId, destHashOrId
                module.db.createEdge(post, tags[idx], { label: "tag" }, function(err, edge) {
                    if (err) return next(err);

                    tags.pop();

                    if (tags.length === 0) {
                        res.redirect("/");
                    }
                });
            }
        });
    });

};

function ensureSchemaIsSetup(callback) {
    if (module.db.getClassByName("Post") === null) {
        module.db.createClass("Post", "OGraphVertex", callback);
    }
    if (module.db.getClassByName("Tag") === null) {
        module.db.createClass("Tag", "OGraphVertex", callback);
    }
}