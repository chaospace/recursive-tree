(function(){

    function getMinMax( min, max ){
        return Math.random()*(max-min) + min;
    }
    
    /**
    ▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧
        color convert method
    ▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧
    */   
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function hexToRgb(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function getRandomColor(){
        return rgbToHex(parseInt(Math.random()*255), parseInt(Math.random()*255), parseInt(Math.random()*255));
    }
    
    
    var Vector = function( x, y ){
        this.x = x||0;
        this.y = y||0;
    }
    
    Vector.prototype    ={
        
        add: function( v ){
            this.x+=v.x;
            this.y+=v.y;
            return this;
        },
        
        length:function(){
            return Math.sqrt( this.x * this.x + this.y * this.y );
        },
        
        rotate:function( angle ){
            var tempx = this.x;
            var tempy = this.y;
            this.x = Math.cos(angle)*tempx-Math.sin(angle)*tempy;
            this.y = Math.sin(angle)*tempx+Math.cos(angle)*tempy;
            return this;
        },
        
        mult: function( m ){
            this.x*=m;
            this.y*=m;
            return this;
        }
        
        
    }

    var Branch  =function( ctx, point, velocity, radius, color ){
         this.ctx       = ctx;
         this.point     = point;
         this.velocity  = velocity;
         this.radius    = radius || 3;
         this.color     = color || 'rgba( 255, 128, 0, 0.7)';
         this.life      = 0;
         this.checkoutTime = 50+getMinMax(50, 150);
         this.depth= 1;
    }
    
    
    Branch.prototype    ={
        
        draw:function(){
            var c= this.ctx;
            var p= this.point;
            var r= this.radius;
            c.save();
            c.globalCompositeOperation =MODE;
            c.beginPath();
            c.fillStyle = this.color;
            c.moveTo( p.x, p.y );
            c.arc( p.x, p.y, r, 0, Math.PI*2 );
            c.fill();
            c.closePath();
            c.restore();
        },
        
        update:function(){
            
            var angle =  ((getMinMax(-2, 2)*this.depth)*Math.PI/180);
            this.point.add( this.velocity );
            this.life+=this.velocity.length();
            this.radius*=.99;
            this.velocity.rotate( getMinMax(-angle, angle) )
            
        },
        
        clone:function( ){
            var r =new Branch( this.ctx, new Vector(this.point.x, this.point.y), new Vector(this.velocity.x, this.velocity.y), this.radius, this.color);
            r.depth = this.depth+1;
            return r;
        },
        
        checkout:function() {
            
            var hasBranch =this.life - this.checkoutTime > 0 ? true : false;
            if( hasBranch ){
                var n =1+getMinMax( 1, 3);
                for( var i=0; i<n; i++){
                    emitter.add( this.clone() );
                }
                emitter.remove( this );
            } 
            
            if( this.depth > MAX_DEPTHS || this.radius < .7 ){
                emitter.remove( this );
            }
            
        },
        
        render:function(){
            this.draw();
            this.update();
            this.checkout();
        }
    
    } 
    
    
    var Emitter = function(  ){
        this.nodes     =[];
    }
    
    Emitter.prototype   ={
        
        add:function( node ){
            
            this.nodes.push( node );
            
        }, 
        
        remove:function( node ){
            
            for( var i=0; i<this.nodes.length; i++ ){
                if( this.nodes[i] == node ){
                    this.nodes.splice( i, 1);
                    return;
                }
            }
        },
        
        render: function(){
            
            if( this.nodes.length > 0 ) {
                for( var i=0; i<this.nodes.length; i++){
                    this.nodes[i].render();
                }
            } else {
                
            }
        
        },
        
        reset: function(){
            this.nodes = [];
        }
        
    }

    var iScreen;
    var ctx;
    var emitter;
    var MAX_DEPTHS;
    var ParticleTree = function( options ){
        
        iScreen = options.screen || null;
        if( iScreen ){
            ctx     = iScreen.getContext("2d");
            emitter = new Emitter();
            
            window.addEventListener( "resize", this.resizeScreen.bind(this) );
            window.addEventListener( 'mousedown', this.reDrawTree.bind(this) );
            this.initialize( options );
            
        }
        
        
    }
    
    var MODE;
    var DAY     = "darker";
    var NIGHT   = "lighter";
    var RADIUS  = 80;
    function getResetColor(){
         return ( MODE == DAY ) ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
    }
    
    ParticleTree.prototype = {
        
        renderID:null,
        FACTOR:null,
        SPEED:null,
        START_RADIUS:null,
        REPEAT_TIME:null,
       
        color:null,
        
        initialize:function( options ) {
            
            MAX_DEPTHS          =options.depths    || 6;
            this.START_RADIUS   =options.radius    || RADIUS;
            var REPEAT_TIME     = options.repeat   || 0;
            
            setInterval( function(){
                emitter.render();
            }, REPEAT_TIME );    
            
            this.resizeScreen();
            
        },
        
        appendTree:function( e ){
                
            this.FACTOR       =(iScreen.width*1.2)/iScreen.height;
            this.SPEED        = MAX_DEPTHS*.5/this.FACTOR;
            
            this.color = 'rgba('+ parseInt(Math.random()*255) +', '+ parseInt(Math.random()*255) +', '+ parseInt(Math.random()*255) +', 0.2)';
            var n = getMinMax(1, 2);
            var branch;
            
            for( var i=0; i<n; i++ ) {
                branch = new Branch( ctx, new Vector(iScreen.width/2 , (iScreen.height+this.START_RADIUS/2)), new Vector(getMinMax(-1, 1), -this.SPEED), this.START_RADIUS, this.color );
                emitter.add( branch );
            }
            
        },
        
        reDrawTree:function(){
            
            var prevMODE = MODE;
            var scope = this;
            MODE = Math.random() > .4 ? DAY : NIGHT;
            
            document.body.style.backgroundColor = ( MODE == DAY ) ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)";
           
            var count = 1;
            var aniID = setInterval( function(){
            
                if( count < 9 ){
                    
                    ctx.save();
                    ctx.fillStyle   = getResetColor();
                    ctx.fillRect( 0, 0, iScreen.width, iScreen.height );
                    ctx.fill();
                    ctx.restore();
                    count++;
                    
                } else {
                
                    clearInterval(aniID);
                    emitter.reset();
                    scope.appendTree();
                    
                }
                
            }, 20);
       
        },
        
        resizeScreen:function( e ){
            
            var w = window.innerWidth;
            var h = window.innerHeight; 
            
            iScreen.width   = w;
            iScreen.height  = h;
            this.reDrawTree();
        }
    
    }
    
    window.ParitlceTree = ParticleTree;
    
})();

    
    

    


   
    
    
   
    
    
