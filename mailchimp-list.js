
module.exports = function(RED) {
    'use strict';

    function MailChimpAPI(n) {
        RED.nodes.createNode(this,n);
       
        this.mailchimpConfig = RED.nodes.getNode(n.mailchimp);
        
        this.apiKey = this.mailchimpConfig.apiKey;
        
		this.name = n.name;

		var node = this;
		var mailchimp = require('mailchimp-node')(this.apiKey);
        
		if (!mailchimp) {
			node.warn("Missing API key credentials");
			return;
        }

        node.on("input", function(msg) {

            console.log('foi', msg);

            node.sendMsg = function (err, data) {

                console.log(data);
    
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
            }		
    
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
                out[arg]=src["payload"];
            }
    
        }
    
        var service={};
    
        service.create = function(svc, msg, cb){
            var params={};
            
            copyArg(msg,"email",params,undefined,true); 
            copyArg(msg,"status",params,undefined,false); 
            copyArg(msg,"list",params,undefined,false); 

            svc.lists.create(params, cb);
        }
    }
        
    RED.nodes.registerType('mailchimp-list', MailChimpAPI);
    
};
