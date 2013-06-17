const
ejs = require('ejs'),
fs = require('fs'),
url = require('url');

const
monitor = ejs.compile(fs.readFileSync('./lib/static/privsep_templates/monitor.ejs', 'utf-8')),
childHead = ejs.compile(fs.readFileSync('./lib/static/privsep_templates/child_head.ejs', 'utf-8'));

exports.fn = function (req, res, next) {
  res.unprivileged = function () {
    var realSend = res.send;
    res.send = function (body, headers, status) {
      var type = typeof body;
      if (type != 'string') throw 'unsupported send type ' + type;
      var childBody = body.replace('<head>', '<head>' + childHead({
        origin: 'http://127.0.0.1:10002',
        path: url.parse(req.url).pathname
      }));
      var monitorBody = monitor({childBody: childBody});
      realSend.call(res, monitorBody, headers, status);
    }
  };
  next();
};