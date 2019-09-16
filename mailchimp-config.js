module.exports = function(RED) {
    function RemoteServerNode(n) {
        RED.nodes.createNode(this,n);
        this.apiKey = this.credentials.apiKey;
        this.name = n.name;
    }
    RED.nodes.registerType("mailchimp-config",RemoteServerNode,{credentials: {
        apiKey: {type:"text"}
    }});
}
