const nano = require('nano')(ftCouchUrl),
    ft = `ft`,
    ftDB = `ft`;

module.exports = {

    addCandidateTag: async function (cand, tagname) {
        await insertDocP(tag, orgID).then(newT => {
            tag._id = newT.id;
            tag.rev = newT.rev;
            res.send([tag]);
        }).catch(U.pError)

    },
    getCandidates: async (orgID, IDS) => {
        var promise = new Promise((resolve, reject) => {
            var db = nano.use(orgID === ftDB ? ftDB : `db_${orgID}`),
                view = 'candidates',
                options = {};
            if (IDS) {
                options.keys = typeof IDS !== 'string' ? IDS : [IDS]
            }
            db.view(ftDB, view, options, (err, data) => {
                if (err) {
                    reject({
                        failure: 'getCandidatesP',
                        err: err
                    });
                } else {
                    resolve(data.rows);
                }
            });
        });
        return promise;
    },
    getSettings: async (orgID) => {
        var promise = new Promise((resolve, reject) => {
            var db = nano.use(ft);
            db.get(orgID, function (err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });
        });
        return promise;
    },
    insertDocP: async (doc, orgID) => {
        var promise = new Promise(function (resolve, reject) {
            var db = nano.use(orgID === ftDB ? ftDB : `db_${orgID}`);
            db.insert(doc, function (err, body) {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
        return promise;
    },
    bulkUpdateP: async (docs, orgID) => {
        var promise = new Promise(function (resolve, reject) {
            var
            db = nano.use(orgID === ftDB ? ftDB : `db_${orgID}`);
            db.bulk({
                'docs': docs.length ? docs : [docs]
            }, function (err, body, header) {
                if (err) {
                    console.log(__l + ' prom error: ', err);
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        });
        return promise;
    }

};