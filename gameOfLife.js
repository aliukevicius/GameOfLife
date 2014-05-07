function Life(state, context, drawingInformation, value) {
    this.state = state;
    this.value = typeof value !== 'undefined' ? value : 1;
    this.canvasContext = context;

    if (typeof drawingInformation === 'object') {
        this.drawingInformation = drawingInformation;
    } else {
        throw {
            name: "Type error",
            message: "Expected argument to be an object"
        }
    }
}

Life.prototype.isActive = function() {
    return this.state == 1 ? true : false;
}

/**
 * Draw cell on canvas
 */
Life.prototype.updateCanvas = function() {

    if (this.isActive()) {
        this.canvasContext.fillStyle = this.drawingInformation.colorActive;
    } else {
        this.canvasContext.fillStyle = this.drawingInformation.colorInactive;
    }

    this.canvasContext.fillRect(
        this.drawingInformation.topX,
        this.drawingInformation.topY,
        this.drawingInformation.width,
        this.drawingInformation.height
    );
};

Life.prototype.toggle = function() {
    if (this.isActive()) {
        this.state = 0;
    } else {
        this.state = 1;
    }
    this.updateCanvas();
};

Life.prototype.makeAlive = function() {
    this.state = 1;
    this.updateCanvas();
};

Life.prototype.kill = function() {
    this.state = 0;
    this.updateCanvas();
};

function World(canvasId, worldSettings) {
    this.canvas = document.getElementById(canvasId);
    this.rows = worldSettings.rows;
    this.cols = worldSettings.cols;
    this.lifeSize = worldSettings.lifeSize; // single cell size in pixes
    this.canvas.width = this.lifeSize * this.cols - 2;
    this.canvas.height = this.lifeSize * this.rows - 2;

    this.context = this.canvas.getContext('2d');

    this.canvas.style.border = '1px solid #acacac';
    this.lifeSpeed = worldSettings.lifeSpeed; //delay between iterations in milliseconds

    this.lifeForms = [];
    this.lifeChangeList = [];
    this.currentIteration = 1;

    this.activeWorld = null;
    this.mouseDown = false;
    this.previosEditedCell = null;

    this.initEvents();
    this.initWorld();
}

/**
 * Initialise event lsiteners
 */
World.prototype.initEvents = function() {
    var $this = this;

    this.canvas.addEventListener('mousemove', function(event) {
        if ($this.mouseDown) {
            var mousePos = $this.getMousePos(event);
            var cell = $this.collisionDetection(mousePos.x, mousePos.y);

            // prevent turning on and of the same cell while moving in it.
            if ($this.lifeForms[cell.row][cell.col] != $this.previosEditedCell) {
                $this.lifeForms[cell.row][cell.col].toggle();
                $this.previosEditedCell = $this.lifeForms[cell.row][cell.col];
            }
        }
    });

    this.canvas.addEventListener('mousedown', function(event){
        $this.mouseDown = true;
        var mousePos = $this.getMousePos(event);
        var cell = $this.collisionDetection(mousePos.x, mousePos.y);

        if ($this.lifeForms[cell.row][cell.col] != $this.previosEditedCell) {
            $this.lifeForms[cell.row][cell.col].toggle();
            $this.previosEditedCell = $this.lifeForms[cell.row][cell.col];
        }
    });

    this.canvas.addEventListener('mouseup', function(){
        $this.mouseDown = false;
        $this.previosEditedCell = null;
    });
};

/**
 * Return mouse position relative to canvas top left
 * @param event
 * @returns {{x: number, y: number}}
 */
World.prototype.getMousePos = function(event) {
    return {
        x: event.pageX - this.canvas.offsetLeft,
        y: event.pageY - this.canvas.offsetTop
    }
};

/**
 * Draw grid on canvas
 */
World.prototype.initGrid = function() {

    this.context.lineWidth = 1;

    var hLineLength = this.cols * this.lifeSize;
    for(var i = 1; i < this.rows; i++) {
        this.context.moveTo(0, i * this.lifeSize - 0.5);
        this.context.lineTo(hLineLength, i * this.lifeSize - 0.5);
    }

    var vLineLength = this.rows * this.lifeSize;
    for(var i = 1; i < this.cols; i++) {
        this.context.moveTo(i * this.lifeSize - 0.5, 0);
        this.context.lineTo(i * this.lifeSize - 0.5, vLineLength);
    }

    this.context.stroke();
};

/**
 * Fill world with dead cells
 */
World.prototype.initWorld = function() {

    for(var i = 0; i < this.rows; i++) {
        this.lifeForms[i] = [];
        for(var j = 0; j < this.cols; j++) {

            var tmp = new Life(
                0,
                this.context,
                {
                    topX: j * this.lifeSize,
                    topY: i * this.lifeSize,
                    colorActive: '#007900',
                    colorInactive: '#ffffff',
                    width: this.lifeSize-1,
                    height: this.lifeSize-1
                }
            );
            tmp.updateCanvas();
            this.lifeForms[i][j] = tmp;
        }
    }
};

/**
 * Get cell row and col by coordinates
 * @param x
 * @param y
 * @returns {{row: number, col: number}}
 */
World.prototype.collisionDetection = function (x, y) {
    var col = Math.floor(x / this.lifeSize);
    var row = Math.floor(y / this.lifeSize);
    return {
        row: row,
        col: col
    };
};

/**
 * Generate list of cell whose state needs to be changed
 */
World.prototype.generateLifeUpdateList =  function() {
    this.lifeChangeList = [];

    var aliveNeighbours = 0;

    for(var i = 0; i < this.rows; i++) {
        for(var j = 0; j < this.cols; j++) {
            aliveNeighbours = 0;

            if (j > 0) {

                aliveNeighbours += this.lifeForms[i][j-1].isActive();

                if (i > 0) {
                    aliveNeighbours += this.lifeForms[i-1][j-1].isActive();
                }

                if (i < (this.rows-1)) {
                    aliveNeighbours += this.lifeForms[i+1][j-1].isActive();

                }
            }

            if (j < (this.cols - 1)) {
                aliveNeighbours += this.lifeForms[i][j+1].isActive();

                if (i > 0) {
                    aliveNeighbours += this.lifeForms[i-1][j+1].isActive();
                }

                if (i < (this.rows-1)) {
                    aliveNeighbours += this.lifeForms[i+1][j+1].isActive();

                }
            }

            if (i > 0) {
                aliveNeighbours += this.lifeForms[i-1][j].isActive();
            }


            if (i < (this.rows-1)) {
                aliveNeighbours += this.lifeForms[i+1][j].isActive();
            }

            if (
                (aliveNeighbours == 3 && !this.lifeForms[i][j].isActive())
                    ||
                    ((aliveNeighbours < 2 || aliveNeighbours > 3) && this.lifeForms[i][j].isActive())
                ) { // we only need to update cell if it dies or becomes alive
                this.lifeChangeList.push({
                    row: i,
                    col: j
                });
            }
        }
    }
};

World.prototype.updateWorld = function() {
    for(var i = 0; i < this.lifeChangeList.length; i++) {
        var c = this.lifeChangeList[i]
        this.lifeForms[c.row][c.col].toggle();
    }
};

/**
 * Initiate cell update loop
 */
World.prototype.runWorld = function() {
    this.stopWorld();
    var $this = this;
    this.activeWorld =  setInterval(function(){
        $this.generateLifeUpdateList();
        $this.updateWorld();
    }, $this.lifeSpeed);
};

/**
 * Stop cell update loop
 */
World.prototype.stopWorld = function() {
    clearInterval(this.activeWorld);
};