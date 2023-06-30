export class appUrl {
    constructor(params) {
        var me = this;
        this.tgtIn = params.tgtIn ? params.tgtIn : false;
        this.tgtBtn = params.tgtBtn ? params.tgtBtn : false;
        this.url = params.url ? params.url : false; 
        this.params = this.url.searchParams
    
        this.init = function () {
            me.tgtIn.value=me.url.search.substring(1);
            me.tgtBtn.on('click',e=>{
                let u = document.location.href.split("?"),
                    l=u[0]+'?'+me.tgtIn.value;
                window.open(l, "_blank");
            });
        }
        this.changes = function (params){
            me.params = undefined;
            let sp = new URLSearchParams();
            params.forEach(p => {
                sp.set(p.k, p.v);                
            });
            me.tgtIn.value = sp.toString();                                
        }            
        this.change = function (k,v){
            let sp = new URLSearchParams(me.tgtIn.value);
            sp.set(k, v);
            me.tgtIn.value = sp.toString();                                
        }            
        this.init();
    
    }
}