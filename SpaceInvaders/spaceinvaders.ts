
import { interval, fromEvent } from 'rxjs'
import { map, scan, filter,merge} from 'rxjs/operators'

type Key = 'ArrowLeft'|'ArrowRight'|'Space'|'ArrowUp'|'Enter'
type Event = 'keydown' | 'keyup'


function spaceinvaders() {
    const 
      Constants = {
        TopBoundary:0,
        BottomBoundary:600,
        LeftBoundary:15,
        RightBoundary:585,
        BulletRadius:3,
        BulletVelocity:2,
        StartTime: 0,
        PlayerShipVelocity: 4,
        ShipLength: 30,
        startCount: 0,
        AlienVelocity:3,
        AliensAmount: 15,
        ShieldAmount:2,
        AliensPerRow:5,
        AlienRadius:10,

      } as const
      
    type ViewType = 'alien' | 'ship' | 'shield' |'bullet'|'border'|'aBullet'|'shieldHole'

    class Shoot{constructor(){}}
    class Tick { constructor(public readonly elapsed:number) {} }
    class Translate{constructor(public readonly velocity: Vec){}}

    // Function referenced from PiApproximation Video
    class RNG {
      readonly m = 0x80000000
      readonly a = 1103515245
      readonly c = 12345
    
      constructor(readonly state) {}
    
      int(){
        return (this.a*this.state+this.c)%this.m
      }
    
      float(){
        return this.int()/(this.m-1)
      }
    
      next(){
        return new RNG(this.int())
      }
    
    }

    // This is initial value to get the seed which is impure
    const seed = Math.random()
  
    // Function referenced from Asteroids Example Code and adapted
    const keyObservable$ = <T>(e:Event, k:Key, result:()=>T)=>
    fromEvent<KeyboardEvent>(document,e)
        .pipe(
          filter(({code})=>code === k),
          filter(({repeat})=>!repeat),
          map(result)),
        moveLeft = keyObservable$('keydown','ArrowLeft',()=>new Translate(new Vec(-Constants.PlayerShipVelocity,0))),
        stopLeft = keyObservable$('keyup','ArrowLeft',()=> new Translate(Vec.Zero)),
        moveRight = keyObservable$('keydown','ArrowRight',()=> new Translate(new Vec(Constants.PlayerShipVelocity,0))),
        stopRight = keyObservable$('keyup','ArrowRight',() => new Translate(Vec.Zero)),
        shoot = keyObservable$('keydown','Space', ()=> new Shoot())
    
    // Function taken from Asteroids Example Code
    type Circle = Readonly<{pos:Vec,radius:number}>
    type ObjectId = Readonly<{id:string,createTime:number}>

    // Function taken from Asteroids Example Code
    interface IBody extends Circle,ObjectId{
      viewType: ViewType,
      vel: Vec,
      width: number,
      height: number,
      pos: Vec,
      flag:boolean,
    }

    // Function taken from Asteroids Example Code
    type Body = Readonly<IBody>

    type State = Readonly<{
        ship:Body,
        bullets:ReadonlyArray<Body>,
        alienBullets:ReadonlyArray<Body>
        alienRow:ReadonlyArray<Body>,
        time:number,
        objCount: number,
        aBulletCount:number,
        borderleft:Body,
        borderright:Body
        exit:ReadonlyArray<Body>,
        playerScore:number,
        gameOver:boolean,
        gameClear:boolean,
        shield:ReadonlyArray<Body>,
        shieldhole:ReadonlyArray<Body>,
        randomNumber:RNG,
    }>
    
    // Function taken from Asteroids Example Code
    const createShip = (viewType: ViewType) => (pos:Vec) => (vel:Vec) =>
    <Body>{
      viewType:viewType,
      vel:vel,
      pos: pos,
      radius:20,
      createTime:0,
    }

    // Function taken from Asteroids Example Code
    const createCircle = (viewType: ViewType) => (oid:ObjectId) => (circ:Circle)=>(vel:Vec)=>
      <Body>{
        ...oid,
        ...circ,
        viewType:viewType,
        vel:vel,
        id: viewType+oid.id,
      }
    
    // Function referenced from Asteroids Example Code and adapted
    const createSquare = (viewType:ViewType) =>(pos:Vec)=>(width:number)=>(height:number)=>(vel:Vec)=>(boolValue:boolean) =>(oid:string) =>
      <Body>{
          viewType:viewType,
          pos:pos,
          width:width,
          height:height,
          vel:vel,
          flag:boolValue,
          id:viewType+oid,
          
      }
    
    // Function referenced from Asteroids Example Code and adapted
    const createBullet = createCircle('bullet')
    const createAlienBullet = createCircle('aBullet')
    const createAlien = createCircle("alien")

    
    const assignRow = (numb:number):Body => {

      if(numb>=0 && numb <5 ){
        return createAlien({id:String(numb),createTime:Constants.StartTime})
                              ({pos:new Vec(100+((numb%Constants.AliensPerRow)*100),100),radius:Constants.AlienRadius})
                                (Vec.Zero)
      }
      else if (numb>=5 && numb <10){
        return createAlien({id:String(numb),createTime:Constants.StartTime})
        ({pos:new Vec((100+(numb%Constants.AliensPerRow)*100),175),radius:Constants.AlienRadius})
          (Vec.Zero)
      }
      else{
        return createAlien({id:String(numb),createTime:Constants.StartTime})
        ({pos:new Vec(100+((numb%Constants.AliensPerRow)*100),250),radius:Constants.AlienRadius})
          (Vec.Zero)
      }
        
    }
    
    const startAliens = [...Array(Constants.AliensAmount)]
    .map((_,i) => assignRow(i))
                                      
    const startShield = [...Array(Constants.ShieldAmount)]
    .map((_,i)=> i<1?createSquare('shield')(new Vec(75,400))(150)(30)(Vec.Zero)(true)("1")
    :createSquare('shield')(new Vec(375,400))(150)(30)(Vec.Zero)(true)("2"))

    const initialState:State = {
      ship: createShip('ship')(new Vec(300,500))(Vec.Zero),
      bullets:[],
      alienBullets:[],
      borderleft:createSquare('border')(new Vec(100,200))(2)(200)(Vec.Zero)(true)("1"),
      borderright:createSquare('border')(new Vec(500,200))(2)(200)(Vec.Zero)(true)("2"),
      alienRow:startAliens,
      time:0,
      objCount:Constants.startCount,
      aBulletCount:0,
      exit: [],
      playerScore:0,
      gameOver:false,
      gameClear:false,
      shield:startShield,
      shieldhole:[],
      randomNumber:new RNG(seed),
    }

    const updateAlienVelocity = (o:Body) =>(vel:Vec) =><Body>{
      ...o,
      vel:vel,
    }

    const updateBorderVelocity = (o:Body) => (vel:Vec) => (boolValue:boolean) => <Body>{
      ...o,
      vel:vel,
      flag:boolValue
    }

    // Check if body is at boundary if yes will return the xy of the boundary
    const borderCheck = ({x,y}:Vec):Vec => {
      const 
      halt = (n:number) => n > Constants.RightBoundary? Constants.RightBoundary:n<Constants.LeftBoundary?Constants.LeftBoundary:n
      return new Vec(halt(x),y)
    }

    const moveBody = (o:Body) => <Body>{
      ...o,
      pos:o.pos.add(o.vel)
    }
  
    const moveShip = (o:Body) => <Body>{
      ...o,
      pos:borderCheck(o.pos.add(o.vel))
    }

    // Functions to check if a circle intersect a rectangle
    // Referenced from (https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection)
    const clamp = (num:number, min:number, max:number):number => Math.min(Math.max(num, min), max);
    function checkIntersects([circle,rect]:[Body,Body]){
      const rectTop = rect.pos.y
      const rectLeft = rect.pos.x
      const rectRight = rect.pos.x + rect.width
      const rectBottom = rect.pos.y + rect.height
      const closestX = clamp(circle.pos.x,rectLeft,rectRight)
      const closestY = clamp(circle.pos.y,rectTop,rectBottom)
      const distanceX = circle.pos.x - closestX
      const distanceY = circle.pos.y - closestY

      const distanceSquared = (distanceX*distanceX) + (distanceY*distanceY)
      return distanceSquared <= (circle.radius*circle.radius)
    }

    const collision = (s:State) => {

        // Function taken from Asteroids Example Code
        //Ship Collide and Alien + Bullets Collide 
        const 
          bodiesCollide = ([a,b]:[Body,Body]) => a.pos.sub(b.pos).len() <a.radius+b.radius,
          playerBulletsAndAliens = flatMap(s.bullets, b=>s.alienRow.map<[Body,Body]>(r=>([b,r]))),
          collidedBulletsAndAliens = playerBulletsAndAliens.filter(bodiesCollide),
          collidedBullets = collidedBulletsAndAliens.map(([bullet,_]) => bullet),
          collidedAliens = collidedBulletsAndAliens.map(([_,alien]) => alien),
          cut = except((a:Body)=>(b:Body)=>a.id === b.id),
          shipCollided = s.alienBullets.filter(r=>bodiesCollide([s.ship,r])).length>0

      //Alien Bullet + Shield Collide 
        const shieldAndAlienBullet = flatMap(s.alienBullets, b=>s.shield.map<[Body,Body]>(r=>([b,r])))
        const collidedABulletAndShield = shieldAndAlienBullet.filter(checkIntersects)
        const collidedAlienBullets = collidedABulletAndShield.map(([aBullet,_]) => aBullet)

      // Creating a shield hole if there is a collision between shield and alien bullet
        const createShieldHole = collidedAlienBullets.length > 0 ? 
        s.shieldhole.concat(
          collidedAlienBullets.map((_,i)=>
          createCircle('shieldHole')
        ({id:String(s.shieldhole.length),createTime:s.time})
        ({radius:10,pos:new Vec(collidedAlienBullets[i].pos.x,collidedAlienBullets[i].pos.y)})
        (Vec.Zero)))
        :s.shieldhole


        //Update Player Score
        const updatePlayerScore = collidedAliens.length != 0? s.playerScore + 1: s.playerScore + 0
        const reachMaxScore = updatePlayerScore === 15

        // Alien Shoot
        const 
        randomSelectAlien = s.alienRow[Math.floor(s.randomNumber.float()*s.alienRow.length)],
        alienShootChance = s.randomNumber.state >2099999999

        const
        alienShoots = alienShootChance ? 
        s.alienBullets.concat([
                ((unitVec:Vec)=>
                  createAlienBullet({id:String(s.aBulletCount),createTime:s.time})
                    ({radius:Constants.BulletRadius,pos:randomSelectAlien.pos.add(unitVec.scale(10))})
                    (new Vec(0,Constants.BulletVelocity))
                  )(Vec.unitVecInDirection(180))]) 
              :s.alienBullets,

          updateBulletCount = alienShootChance?s.aBulletCount+1:s.aBulletCount

      // Functions to check the direction of movement, true to move right and false to move left
        const wallCollideRight = (lb:Body,rb:Body):boolean =>{
          const borderRightCheck = rb.pos.x 
          const wallCollide = borderRightCheck > 590 && lb.flag == true && rb.flag == true
          return wallCollide
        }
  
        const wallCollideLeft = (lb:Body,rb:Body):boolean =>{
          const borderLeftCheck = lb.pos.x
          const reboundLeft = borderLeftCheck < 15 && lb.flag === false && rb.flag === false
          return reboundLeft
        }
        
        const moveBorderLeft = (lb:Body,rb:Body):boolean =>{
          const reboundLeft = lb.flag === false && rb.flag ===false
          return reboundLeft
        }  
        const moveBorderRight = (lb:Body,rb:Body):boolean =>{
          const reboundRight = lb.flag === true && rb.flag ===true
          return reboundRight
        }


        // If collide left wall or right wall will move down 
        function moveBorder(border:Body):Body{
          if (wallCollideRight(s.borderleft,s.borderright)){
            return updateBorderVelocity(border)(new Vec(0,30))(false)
        }
        else if(wallCollideLeft(s.borderleft,s.borderright)){
          return updateBorderVelocity(border)(new Vec(0,30))(true)
        }
        else if (moveBorderLeft(s.borderleft,s.borderright)){
          return updateBorderVelocity(border)(new Vec(-0.5,0))(false)
        }
        else if (moveBorderRight(s.borderleft,s.borderright)){
          return updateBorderVelocity(border)(new Vec(0.5,0))(true)
        }
      
      } 

      function moveAliens(alien_arr:ReadonlyArray<Body>):ReadonlyArray<Body>{
          if(wallCollideRight(s.borderleft,s.borderright)){
            return alien_arr.map((_,i)=>updateAlienVelocity(alien_arr[i])(new Vec(0,30)))
          }
          else if (wallCollideLeft(s.borderleft,s.borderright)){
            return alien_arr.map((_,i)=>updateAlienVelocity(alien_arr[i])(new Vec(0,30)))

          }
          else if(moveBorderLeft(s.borderleft,s.borderright)){
            return alien_arr.map((_,i)=>updateAlienVelocity(alien_arr[i])(new Vec(-0.5,0)))

          }
          else if(moveBorderRight(s.borderleft,s.borderright)){
            return alien_arr.map((_,i)=>updateAlienVelocity(alien_arr[i])(new Vec(0.5,0)))

          }
        }

      // Check if alien is out of canvas
      const
        checkAlienPosition = (a:Body) => a.pos.y>Constants.BottomBoundary,
        alienOutofCanvas = s.alienRow.filter(r=>checkAlienPosition(r)).length>0

      return <State>{
        ...s,
        bullets: cut(s.bullets)(collidedBullets),
        alienRow: moveAliens(cut(s.alienRow)(collidedAliens)),
        alienBullets:cut(alienShoots)(collidedAlienBullets),
        exit:s.exit.concat(collidedBullets,collidedAliens),
        playerScore: updatePlayerScore,
        borderleft: moveBorder(s.borderleft),
        borderright:moveBorder(s.borderright),
        gameOver:shipCollided||alienOutofCanvas,
        gameClear:reachMaxScore,
        shieldhole:createShieldHole,
        aBulletCount:updateBulletCount
      }
    }

    const tick = (s:State,elapsed:number)=>{
      const 
        outOfTopCanvas = (b:Body) => (b.pos.y) < Constants.TopBoundary,
        activeBullets = s.bullets.filter(not(outOfTopCanvas)),
        outOfBottomCanvas = (b:Body) => (b.pos.y) >Constants.BottomBoundary,
        activeABullets = s.alienBullets.filter(not(outOfBottomCanvas)),
        expiredBullets:Body[] = (s.bullets.filter(outOfTopCanvas),s.alienBullets.filter(outOfBottomCanvas)),
        activeAliens = s.alienRow

      return collision({...s,
        ship:moveShip(s.ship),
        alienRow:activeAliens.map(moveBody),
        bullets:activeBullets.map(moveBody),
        borderleft:moveBody(s.borderleft),
        borderright:moveBody(s.borderright),
        alienBullets:activeABullets.map(moveBody),
        exit:expiredBullets,
        randomNumber:s.randomNumber.next()
      })

    }
    
    // Function referenced from Asteroids Example Code and adapted
    const reduceState = (s:State,e:Translate|Tick|Shoot)=>
    e instanceof Translate ? {...s,
      ship:{...s.ship,vel:e.velocity},

    }:
    e instanceof Shoot ? {...s,
      bullets: s.bullets.concat([
        ((unitVec:Vec)=>
          createBullet({id:String(s.objCount),createTime:s.time})
            ({radius:Constants.BulletRadius,pos:s.ship.pos.add(unitVec.scale(s.ship.radius))})
            (new Vec(0,-Constants.BulletVelocity))
         )(Vec.unitVecInDirection(0))]),
      objCount: s.objCount + 1

    }:tick(s,e.elapsed)
    
    // Function referenced from Asteroids Example Code and adapted
    const subscription = interval(10).pipe(
      map(elapsed => new Tick(elapsed)),
      merge(moveLeft,moveRight,stopLeft,stopRight,shoot),
      scan(reduceState,initialState)
    ).subscribe(updateView)

    // Function referenced from Asteroids Example Code and adapted
    // Only Impure Function in the program
    function updateView(s:State){

      const
        ship = document.getElementById("ship")!,
        borderleft = document.getElementById("vertiline"),
        borderright = document.getElementById("vertiline2"),
        playerscore = document.getElementById("playerscore")!,

        
      // Function taken from Asteroids Example Code 
        attr = (e:Element, o:any) =>
        // for transformation
        {for(const k in o) {
          e.setAttribute(k, String(o[k]))
        }
        },
        svg = document.getElementById("canvas")!, 

        
      // Function taken from Asteroids Example Code
      updateBodyView = (b:Body) => {
        function createBodyView() {
          const v = document.createElementNS(svg.namespaceURI, "ellipse")!;
          attr(v,{id:b.id,rx:b.radius,ry:b.radius});
          v.classList.add(b.viewType)
          svg.appendChild(v)
          return v;
        }

        const v = document.getElementById(b.id) || createBodyView();
        attr(v,{cx:b.pos.x,cy:b.pos.y});
        
      }

      attr(ship,{transform:`translate(${s.ship.pos.x},${s.ship.pos.y})`})
      s.bullets.forEach(updateBodyView)
      s.alienRow.forEach(updateBodyView)
      s.alienBullets.forEach(updateBodyView)
      s.shieldhole.forEach(updateBodyView)
      attr(borderleft,{transform:`translate(${s.borderleft.pos.x},${s.borderleft.pos.y})`})
      attr(borderright,{transform:`translate(${s.borderright.pos.x},${s.borderright.pos.y})`})
      playerscore.textContent = String(s.playerScore)

      
      // Function taken from Asteroids Example Code
      s.exit.map(o=>document.getElementById(o.id))
      .filter(isNotNullOrUndefined)
      .forEach(v=>{
        try {
          svg.removeChild(v)
        } catch(e) {
          // rarely it can happen that a bullet can be in exit 
          // for both expiring and colliding in the same tick,
          // which will cause this exception
          console.log("Already removed: "+v.id)
        }
      })

      // Checks if GameOver or Game Clear is true and stops the game
      if(s.gameOver||s.gameClear) {
        subscription.unsubscribe();
        const v = document.createElementNS(svg.namespaceURI, "text")!;
        const restart = document.createElementNS(svg.namespaceURI,"text")!;
        if(s.gameOver){
        attr(v,{x:100,y:300,class:"gameover"});
        attr(restart,{x:100,y:500,class:"restart"})
        v.textContent = "Game Over";
        }
        else if(s.gameClear){
          attr(v,{x:100,y:300,class:"gameClear"});
          attr(restart,{x:100,y:500,class:"restart"})
          v.textContent = "Game Cleared";
        }
        restart.textContent = "Restart"

        svg.appendChild(v);
        svg.appendChild(restart);

        restart.addEventListener("click", function(){
          v.textContent = "";
          restart.textContent = "";
          svg.appendChild(restart);
          svg.appendChild(v);
          
          const subscription = interval(10).pipe(
            map(elapsed => new Tick(elapsed)),
            merge(moveLeft,moveRight,stopLeft,stopRight,shoot),
            scan(reduceState,initialState)
          ).subscribe(updateView)
        })
      }    
    }
  }
  
  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      spaceinvaders();
    }
  
  
// Function taken from Asteroids Example Code
class Vec {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  add = (b:Vec) => new Vec(this.x + b.x, this.y + b.y)
  sub = (b:Vec) => this.add(b.scale(-1))
  len = ()=> Math.sqrt(this.x*this.x + this.y*this.y)
  scale = (s:number) => new Vec(this.x*s,this.y*s)
  ortho = ()=> new Vec(this.y,-this.x)
  rotate = (deg:number) =>
            (rad =>(
                (cos,sin,{x,y})=>new Vec(x*cos - y*sin, x*sin + y*cos)
              )(Math.cos(rad), Math.sin(rad), this)
            )(Math.PI * deg / 180)

  static unitVecInDirection = (deg: number) => new Vec(0,-1).rotate(deg)
  static Zero = new Vec();
}

// Function taken from Asteroids Example Code
function showKeys() {
  function showKey(k:Key) {
    const arrowKey = document.getElementById(k)!,
      o = (e:Event) => fromEvent<KeyboardEvent>(document,e).pipe(
        filter(({code})=>code === k))
    o('keydown').subscribe(e => arrowKey.classList.add("highlight"))
    o('keyup').subscribe(_=>arrowKey.classList.remove("highlight"))
  }
  showKey('ArrowLeft');
  showKey('ArrowRight');
  showKey('Space');
}

setTimeout(showKeys, 0)

// Function taken from Asteroids Example Code
const 
not = <T>(f:(x:T)=>boolean)=> (x:T)=> !f(x)

// Function taken from Asteroids Example Code
function flatMap<T,U>(
  a:ReadonlyArray<T>,
  f:(a:T)=>ReadonlyArray<U>
): ReadonlyArray<U> {
  return Array.prototype.concat(...a.map(f));
}

// Function taken from Asteroids Example Code
const
elem = 
<T>(eq: (_:T)=>(_:T)=>boolean)=> 
  (a:ReadonlyArray<T>)=> 
    (e:T)=> a.findIndex(eq(e)) >= 0

// Function taken from Asteroids Example Code
const
except = 
<T>(eq: (_:T)=>(_:T)=>boolean)=>
  (a:ReadonlyArray<T>)=> 
    (b:ReadonlyArray<T>)=> a.filter(not(elem(eq)(b)))


// Function taken from Asteroids Example Code
function isNotNullOrUndefined<T extends Object>(input: null | undefined | T): input is T {
  return input != null;
}
