var Mailchimp = require('mailchimp-api-v3');
var crypto = require('crypto');

module.exports = function(RED) {
    'use strict';

    function MailChimpAPI(n) {
        RED.nodes.createNode(this,n);
       
        this.mailchimpConfig = RED.nodes.getNode(n.mailchimp);
        
        this.apiKey = n.apiKey || this.mailchimpConfig.apiKey;
        
		this.name = n.name;

		var node = this;
        
        var mailchimp = new Mailchimp(this.apiKey);

		if (!mailchimp) {
			node.warn("Missing API key credentials");
			return;
        }

        node.on("input", function(msg) {

            node.sendMsg = function (err, data) {
    
                if (err) {
    
                    node.status({ fill: "red", shape: "ring", text: "error"});
                    node.error("failed: " + err.toString(), msg);
                    node.send([null, { err: err }]);

                    return;
    
                } else {
    
                    msg.payload = data;
                    node.status({});
    
                }

                node.send([msg,null]);
            };
        
            var _cb = function(err, data) {
                node.sendMsg(err, data);
            };		
    
            if (typeof service[msg.payload.operation] == "function") {
    
                node.status({ fill:"blue", shape:"dot", text:msg.payload.operation });
                service[msg.payload.operation](mailchimp, msg, _cb);
    
            } else {
    
                node.error("failed: Operation node defined - " + msg.payload.operation);
    
            }
    
        });
    
        var copyArg = function(src,arg,out,outArg,isObject) {
    
            var tmpValue = src[arg];
            outArg = (typeof outArg !== 'undefined') ? outArg : arg;
    
            if (typeof src[arg] !== 'undefined'){
                
                if (isObject && typeof src[arg]=="string" && src[arg] != "") { 
                    tmpValue = JSON.parse(src[arg]);
                }
    
                out[outArg] = tmpValue;
            }
            
            if ( arg == "Payload" && typeof tmpValue == 'undefined' ){
                out[arg] = src["payload"];
            }
    
        }
    
        var service={};
    
        service.get = function(svc, msg, cb){
            var params={};

            copyArg(msg.payload,"email_address",params,undefined,false); 
            copyArg(msg.payload,"list",params,undefined,false);

            var hash = crypto.createHash('md5').update(params.email_address).digest('hex');

            svc.get('/lists/' + params.list + '/members/' + hash)
                .then(function(results) {
                    
                    console.log(results);
                    // cb(null, results);

                })
                .catch(function (err) {
                    
                    console.log(err);
                    // cb(err);

                });
        }

        service.create = function(svc, msg, cb){
            var params={};

            copyArg(msg.payload,"email_address",params,undefined,false); 
            copyArg(msg.payload,"status",params,undefined,false);
            copyArg(msg.payload,"merge_fields",params,undefined,true); 
            copyArg(msg.payload,"list",params,undefined,false);
            copyArg(msg.payload,"tags",params,undefined,true); 

            svc.post('/lists/' + params.list + '/members', params)
                .then(function(results) {
                    
                    cb(null, results);

                })
                .catch(function (err) {
                    
                    if (err.status == 400) {

                        var hash = crypto.createHash('md5').update(params.email_address).digest('hex');

                        svc.patch('/lists/' + params.list + '/members/' + hash, params)
                            .then(function(results) {

                                var tags = params.tags.map( function(val) {
                                    return { name: val, status: 'active' }
                                });

                                svc.post('/lists/' + params.list + '/members/' + hash + '/tags', { tags: tags });

                                cb(null, results);

                            })
                            .catch(function (err) {
                                
                                cb(err);

                            });

                    } else {

                        cb(err);

                    }

                });
        }

        service.update = function(svc, msg, cb){
            var params={};

            copyArg(msg.payload,"email_address",params,undefined,false); 
            copyArg(msg.payload,"status",params,undefined,false);
            copyArg(msg.payload,"merge_fields",params,undefined,true); 
            copyArg(msg.payload,"list",params,undefined,false);
            copyArg(msg.payload,"tags",params,undefined,true); 
            
        }
    }
        
    RED.nodes.registerType('mailchimp-list', MailChimpAPI);
    
};
