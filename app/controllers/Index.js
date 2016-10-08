var mongoose = require('mongoose')
    var User = mongoose.model('User')
    var Mydoc = mongoose.model('Mydoc')
    var Events = mongoose.model('Events')
    var GeoJSON = require('geojson')
    var request = require('request')
    var xml2js = require('xml2js')

    var parser = new xml2js.Parser(
    {
        attrkey : "_key"
    }
    )

    // var Course = mongoose.model('Course')
    // var Category = mongoose.model('Category')

    // index page
    exports.index = function (req, res)
{

    if (req.session.user)
    {
        Mydoc
        .find({},
        {
            content : 0,
            _v : 0,
            owner : 0
        }
        )
        .exec(function (err, data)
        {
            if (err)
            {
                console.log(err)
            }
            var mydoc = {}
            mydoc['data'] = data.slice(0, 10)
                mydoc['totalPages'] = Math.ceil(data.length / 10)
                mydoc['currentPage'] = 1

                // console.log(mydoc)
                res.render('index',
                {
                    doc : mydoc
                }
                )
        }
        );
    }
    else
        res.render('index', {}

        )
}

exports.mydoc = function (req, res)
{
    var pyloads = req.body
        var data = new Object()

        Mydoc.findById(pyloads.doc, function (err, doc)
        {
            if (err)
            {
                console.log(err)
            }
            // data.content=doc.content

            Events.find(
            {
                mydoc : doc._id
            }
            )
            .populate('mydoc', 'content')
            .exec(function (err, events)
            {
                /*
                "json" : {
                "response" :
            { "content" :
                [
            {
                "Location" :
                [
            { "_key" : { "lat" : "42.81795999", "lng" : "93.51336799" }, "_" : "哈密" },
            { "_key" : { "lat" : "39.731598", "lng" : "98.493577" }, "_" : "酒泉" }
                ],

                "person" : [ "邓力群", "彭德怀同志", "邓力群同志" ],

                "time" : [ " "1949-10-13\"" ],

                "_" : "为中共中央起草致电:“据十月十二日电称:‘为了解自治区情况及对自治军给以适当照顾请其派军事政治代表乘中苏班机飞由我驻哈第二军派汽车送来商讨自治军编制为国军及其他政策。这些事事先取得他们同意再办似较稳妥\n。如认为必要请通知转达’等语请即转商是否可行并复\n。”\n" }

                ] } },
                "meta" : { "updateAt" : ISODate("2016-08-30T02:12:24.302Z"), "createAt" : ISODate("2016-08-30T02:12:24.302Z") },
                "__v" : 0 }

                 */

                //分类 时序 文档 和 非时序 文档
                if (doc.sequence)
                {
                    var vilid_events = new Array()
                        for (var i = 0; i < events.length; i++)
                        {
                            if (events[i].json != null && typeof(events[i].json.response.content[0]) == "object" && 'Location' in events[i].json.response.content[0])
                            {
                                var contents = events[i].json.response.content[0]
                                    var std_event = new Object()
                                    std_event.start = ('time' in contents) ? contents.time[0] : ""
                                    std_event.content = ('time' in contents) ? contents.time[0] : "" //('_' in contents)?contents._:""
                                    std_event.id = i
                                    std_event.e_id = events[i]._id
                                    vilid_events.push(std_event)
                            }
                        }
                        data.json = vilid_events
                        data.sequence = true
                        res.json(data)
                }
                else
                {
                    var vilid_events = []

                    for (var i = 0; i < events.length; i++)
                    {
                        var temp = events[i].json.response.content[0]
                            temp.e_id = events[i]._id
                            vilid_events.push(temp)
                    }
                    data.json = vilid_events
                        data.sequence = false
                        res.json(data)
                }
            }
            )
        }
        )
}

exports.event = function (req, res)
{
    var pyloads = req.body
        var data = new Object()

        Events.findOne(
        {
            _id : pyloads.e_id
        }
        )
        .populate('mydoc', 'sequence')
        .exec(function (err, event)
        {
            if (err)
            {
                console.log(err)
            }
            data.content = event.raw
                data.xml = event.xml
                var vilid_events = new Array()
                //一篇文档中的时空事件
                var doc_events = new Array()
                var contents = event.json.response.content[0]
                var locations = contents.Location
                for (var j = 0, l = locations.length; j < l; j++)
                {
                    var iter_event = locations[j]
                        var std_event = new Object()
                        std_event.time = "time" in contents ? contents.time[0] : ""
                        std_event.event = event.mydoc.sequence ? event.raw : ""
                        std_event.location = contents.Location[j]._
                        std_event.lng = contents.Location[j]._key.lng
                        std_event.lat = contents.Location[j]._key.lat
                        vilid_events.push(std_event)
                }
                data.json = event.json
                data.geojson = GeoJSON.parse(vilid_events,
                {
                    Point : ['lat', 'lng']
                }
                );
            res.json(data)
        }
        )
}

exports.geocode = function (req, res)
{
    var payloads = req.body

        var options =
    {
        method : "GET",
        url : 'http://geocode.svail.com:8080/p41',
        encoding : "utf-8",
        qs :
        {
            f : "json",
            queryStr : payloads.str,
            key : "327D6A095A8111E5BFE0B8CA3AF38727"
        }
    };
    request(options, function (error, response, body)
    {
        if (!error && response.statusCode == 200)
        {
            var result = JSON.parse(body)
                console.log(result)
                var locjson = new Object
                if (result.result[0].status == "OK")
                {
                    locjson.lat = result.result[0].location.lat
                        locjson.lng = result.result[0].location.lng
                        locjson.str = result.result[0].query_string
                }
                else
                {
                    locjson.str = result.result[0].query_string
                        locjson.lng = "在线匹配失败,请手动定位"
                        locjson.lat = ""

                }
                res.json(locjson)
        }
    }
    )
}

exports.updateXml = function (req, res)
{
    var payloads = req.body
        Events.findOne(
        {
            _id : payloads.e_id
        }
        )
        .exec(function (err, event)
        {
            if (err)
            {
                console.log(err)
            }
            event.xml = event.xml.replace(eval("/" + payloads.poiName + "/g"), "<Location lng=" + "'" + payloads.poiLng + "'" + " lat=" + "'" + payloads.poiLat + "'>" + payloads.poiName + "</Location>")

                parser.parseString(event.xml, function (err, data)
                {
                    if (err)
                    {
                        console.log(err)
                    }
                    event.json = data
                        event.save(function (err, data)
                        {
                            if (err)
                            {
                                console.log(err)
                                res.json(
                                {
                                    status : "error"
                                }
                                )
                            }
                            console.log(data)
                            res.json(
                            {
                                status : "ok"
                            }
                            )
                        }
                        )
                }
                )
        }
        )
}
