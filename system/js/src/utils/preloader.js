export default class {

    constructor (node  = mandatory(), textNode, radius, opts, imgName, initialMessage) {
        let canv;
            
        if (node === null || node === undefined) { return; }
        
        this.node = node;
        canv = document.createElement("canvas");
                        
        this.messages = textNode;
        this.canv = canv;
        this.ctx = canv.getContext("2d");
        this.loadCurrent = 0;
        this.radius = radius;

        this.canv.width = Math.round(radius * 2);
        this.canv.height = Math.round(radius * 2);
        this.setPixelRatio();
        
        this.opts = opts;
        this.node.appendChild(canv);

        this.image = imgName ? document.getElementById(imgName) : null;
        if (initialMessage) { this.setMessage(initialMessage); }
    }

    static mandatory() {
        throw new Error('Missing parameter');
    }

    rectLoader() {
        let per = this.loadCurrent,
            ctx = this.ctx,
            cen = this.radius,
            cenDouble = cen * 2,
            cenHalf = Math.round(cen / 2),
            angle = per * 2 * Math.PI,
            options = this.opts;
        
        ctx.clearRect(0, 0, cenDouble, cenDouble);

        ctx.beginPath();
        ctx.arc(cen, cen, cenHalf, 0, 2 * Math.PI, false);
        ctx.fillStyle = options.loaderColor;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = options.loaderColor;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cen, cen, Math.round(cenHalf / 2), 0, angle, false);
        ctx.lineWidth = cenHalf;
        ctx.strokeStyle = options.loaderColorSucess;
        ctx.stroke();

        if (this.image) {
            ctx.drawImage(this.image, cenHalf, cenHalf, cen, cen);
        } 
    };
        
    setPixelRatio() {
        
        let oldWidth, oldHeight,
            ctx = this.ctx,
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1,
            ratio = devicePixelRatio / backingStoreRatio;
        
        if (devicePixelRatio !== backingStoreRatio) {

            oldWidth = this.canv.width;
            oldHeight = this.canv.height;

            this.canv.width = oldWidth * ratio;
            this.canv.height = oldHeight * ratio;

            this.canv.style.width = oldWidth + "px";
            this.canv.style.height = oldHeight + "px";

            this.ctx.scale(ratio, ratio);
        }
    };
        
    setMessage(message, isError = false) {
        if (this.messages) {
            this.messages.innerHTML = message;
            this.messages.style.color = isError ? "red" : ""; 
        }
    };
        
    updateLoader(per, speed) {
        let me = this;
        if (!me.node) { return; }
        TweenLite.to(me, speed, {
            loadCurrent: per,
            ease: Power1.easeInOut,
            onUpdate: me.rectLoader,
            onUpdateScope: me
        });
    };
        
    startAnimation() {
        if (!this.node) { return; }
        this.rectLoader();
        this.updateLoader(0.4, 2);
    };

    stopAnimation() {
        if (!this.node) { return; }
        this.updateLoader(1, 0.25);
    };
        
    setPercentage(per) {
        if (!this.node) { return; }
        this.loadCurrent = per;
        this.rectLoader();
    };
        
    show() {
        if (!this.node) { return; }
        this.node.style.display = "block";
    };
        
    hide() {
        if (!this.node) { return; }
        this.node.style.display = "none";
    };        
}