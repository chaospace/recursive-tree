   /**
    ▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧
        recursive-tree
        step4
            random컬러 변경처리 추가 
        
        step3
            resize처리를 넣어보자 과연..
        
        step2   
            branch와 emitter의 관계 정리
              어느 시점에 renderer를 멈추느냐를 판단해야 할듯.
        
    ▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧▧
    */
    
    var iScreen = document.getElementById("iScreen");
    var ctx     = iScreen.getContext("2d");
    
    var OW      =640;
    var OH      =480;
    
    
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
         this.checkoutTime = getMinMax(150, 200);
         this.generation= 1;
    }
    
    Branch.prototype    ={
        
        draw:function(){
            var c= this.ctx;
            var p= this.point;
            var r= this.radius;
            c.save();
            c.globalCompositeOperation ='lighter';
            c.beginPath();
            c.fillStyle = this.color;
            c.moveTo( p.x, p.y );
            c.arc( p.x, p.y, r, 0, Math.PI*2 );
            c.fill();
            c.closePath();
            c.restore();
        },
        
        update:function(){
            
            var angle = 0.18-(0.10/this.generation);
            this.point.add( this.velocity );
            this.life+=this.velocity.length();
            this.radius*=.99;
            this.velocity.rotate( getMinMax(-angle, angle) )
            
        },
        
        clone:function( ){
            var r =new Branch( this.ctx, new Vector(this.point.x, this.point.y), new Vector(this.velocity.x, this.velocity.y), this.radius, this.color)
            r.generation = this.generation+1;
            return r;
        },
        
        checkout:function() {
            var hasBranch =this.life - this.checkoutTime > 0 ? true : false;
            if( hasBranch ){
                var n = getMinMax( 1, 3);
                for( var i=0; i<n; i++){
                    emitter.add( this.clone() );
                }
                // 여기서 branch를 버린다면..
                emitter.remove( this );
            } 
            
            if( this.radius < 1 || this.generation > MAX_DEPTH ){
                // 여기서 branch를 버린다면..
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
                clearInterval(renderID);
                console.log("stop-repeat");
            }
        
        },
        
        reset: function(){
            this.nodes = [];
        }
        
    }
    
    function onResize_Screen( e ){
        
        
        // browser viewport size
        var w = window.innerWidth;
        var h = window.innerHeight; 
        
        // scale 구하기 
        var scale = Math.min(w/OW, h/OH);
        iScreen.width = OW * scale;
        iScreen.height = OH * scale;
        console.log("resize");
        redrawTree();
    }
    
    var FACTOR;
    var SPEED;
    var START_RADIUS=30;
    var REPEAT_TIME =0;
    var MAX_DEPTH   =8;
    var emitter = new Emitter();
    var renderID;
    function redrawTree(){
        
        ctx.fillStyle='rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, iScreen.width, iScreen.height);
        ctx.fill();
        if(renderID){
            clearInterval(renderID);
            emitter.reset();
        }
        FACTOR       =(iScreen.width*.95)/iScreen.height;
        SPEED        =MAX_DEPTH*.5/FACTOR;
        
        var rColor  =getRandomColor();
        
        var b = new Branch( ctx, new Vector(iScreen.width/2, iScreen.height), new Vector(getMinMax(-1, 1), -SPEED), START_RADIUS/FACTOR , rColor)
        var ab = new Branch( ctx, new Vector(iScreen.width/2, iScreen.height), new Vector(getMinMax(-1, 1), -SPEED), START_RADIUS/FACTOR, rColor )
        var abc = new Branch( ctx, new Vector(iScreen.width/2, iScreen.height), new Vector(getMinMax(-1, 1), -SPEED), START_RADIUS/FACTOR, rColor )
        emitter.add( b );
        emitter.add( ab );
        emitter.add( abc );
    
        renderID = setInterval( function(){
            emitter.render();
        }, REPEAT_TIME );    
        
    }
    
    onResize_Screen();
  
    function onDown_Screen(){
        redrawTree();
    }
    window.addEventListener( "resize", onResize_Screen );
    window.addEventListener( 'mousedown', onDown_Screen );