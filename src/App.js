import React, { useEffect } from 'react'
import Victor from 'victor'
import './App.css'
import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import earth from './assets/default.png'

const worldSize = 8000
const spriteSize = 300
const sizeScale = 10

export default () => {
    useEffect(() => {
        const app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            resolution: window.devicePixelRatio || 1,
            antialias: true
        })
        document.body.appendChild(app.view)

        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: worldSize,
            worldHeight: worldSize,

            interaction: app.renderer.plugins.interaction
        })

        viewport.moveCenter(worldSize / 2, worldSize / 2)

        app.stage.addChild(viewport)

        viewport
            .drag()
            .pinch()
            .wheel()
            .decelerate()

        const renderTexture = PIXI.RenderTexture.create(worldSize, worldSize)
        const renderTextureSprite = new PIXI.Sprite(renderTexture)
        viewport.addChild(renderTextureSprite)

        const brush = new PIXI.Graphics()
        brush.beginFill(0xffffff)
        brush.drawCircle(0, 0, 3)
        brush.endFill()
        brush.cacheAsBitmap = true


        const drawTail = (x, y) => {
            brush.position.x = x
            brush.position.y = y
            app.renderer.render(brush, renderTexture, false, null, false)
        }


        class SpaceObject extends PIXI.Sprite {
            static spaceObjects = []

            constructor(x, y, vec, m, id, name = SpaceObject.spaceObjects.length) {
                super(PIXI.Texture.from(require(`./assets/${name}.png`)))
                this.anchor.set(0.5)
                this.vec = vec
                this.x = x
                this.y = y
                this.m = m
                this.id = id
                this.collisionDone = false
                this.radius = Math.pow((3 * m) / (4 * Math.PI), 0.333)
                this.scale.set(sizeScale * this.radius / (spriteSize * 0.62 / 2))

                viewport.addChild(this)
            }


            static updatePhysics() {
                SpaceObject.spaceObjects.forEach(target => {
                    SpaceObject.spaceObjects.forEach(source => {
                        if (target.id === source.id) return

                        let dirX = source.x < target.x ? -1 : 1
                        let dirY = source.y < target.y ? -1 : 1

                        let distance = Math.sqrt((target.x - source.x) ** 2 + (target.y - source.y) ** 2)
                        let force = source.m / distance ** 2

                        target.vec.x += force * dirX 
                        target.vec.y += force * dirY 

                        if (distance <= sizeScale * (target.radius + source.radius)) {
                            bounce(target, source)
                        }
                    })
                })
            }


            move(delta = 1) {
                this.x += this.vec.x * delta
                this.y += this.vec.y * delta

                drawTail(this.x, this.y)
            }

            static moveAll(delta = 1) {
                SpaceObject.spaceObjects.forEach(sp_ob => sp_ob.move(delta))
                SpaceObject.updatePhysics()
            }
        }


        SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+50,  worldSize / 2 + 100, Victor(0, -1), 1, 1   , 'planet1'))
        SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+70,  worldSize / 2 + 100, Victor(0, -1), 1, 2   ,'planet2'))
        SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+90,  worldSize / 2 + 100, Victor(0, -1), 1, 3   , 'planet3'))
        SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+110, worldSize / 2 + 100, Victor(0, -1), 1, 4   ,'planet4'))
        SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+130, worldSize / 2 + 100, Victor(0, -1), 1, 5   ,'planet5'))
        // SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+150, worldSize / 2 + 100, Victor(0, -1), 1, 6   , 'planet10'))
        SpaceObject.spaceObjects.push(new SpaceObject(worldSize / 2+100, worldSize / 2 - 100, Victor(0, .1), 40, 7   ,'planet11'))

        app.ticker.add(delta => {
            SpaceObject.moveAll(delta)
        })

        return () => {
            document.body.removeChild(app.view)
        }
    }, [])

    return (<></>)
}


const bounce = (target, source) => {
    if (target.collisionDone) {
        target.collisionDone = false
        return
    }


    // const newTargetVec_x = (target.m * Math.sin(target.vec.angle()) - source.m * Math.cos(target.vec.angle())) / (target.m + source.m) * target.vec.x
    // const newTargetVec_y = (target.m * Math.sin(target.vec.angle()) - source.m * Math.cos(target.vec.angle())) / (target.m + source.m) * target.vec.y    
    // const newSourceVec_x = 2 * source.m * Math.sin(source.vec.angle()) / (target.m + source.m) * source.vec.x
    // const newSourceVec_y = 2 * source.m * Math.sin(source.vec.angle()) / (target.m + source.m) * source.vec.y

    const V1 = target.vec.magnitude()
    const V2 = source.vec.magnitude()
    const m1 = target.m
    const m2 = source.m
    const m = m1 + m2
    const dir1 = -target.vec.direction()
    const dir2 = -source.vec.direction()
    const ph = Victor(target.x - source.x, target.y - source.y).rotateBy(Math.PI/3).direction()

    console.log({V1,V2,m1,m2,dir1,dir2,ph})

    const newTargetVec_x = ((V1 * Math.cos(dir1 - ph) * (m1 - m2) + 2 * m2 * V2 * Math.cos(dir2 - ph)) * Math.cos(ph) )/ m + V1 * Math.sin(dir1 - ph) * Math.cos(ph + Math.PI/2)
    const newTargetVec_y = ((V1 * Math.cos(dir1 - ph) * (m1 - m2) + 2 * m2 * V2 * Math.cos(dir2 - ph)) * Math.sin(ph) )/ m + V1 * Math.sin(dir1 - ph) * Math.sin(ph + Math.PI/2)
    
    const newSourceVec_x = ((V2 * Math.cos(dir2 - ph) * (m2 - m1) + 2 * m1 * V1 * Math.cos(dir1 - ph)) * Math.cos(ph) )/ m + V2 * Math.sin(dir2 - ph) * Math.cos(ph + Math.PI/2)
    const newSourceVec_y = ((V2 * Math.cos(dir2 - ph) * (m2 - m1) + 2 * m1 * V1 * Math.cos(dir1 - ph)) * Math.sin(ph) )/ m + V2 * Math.sin(dir2 - ph) * Math.sin(ph + Math.PI/2)



    target.vec = Victor(newTargetVec_x, newTargetVec_y)
    target.move()
    target.collisionDone = true

    if (source.collisionDone) {
        source.collisionDone = false
    } else {
        source.vec = Victor(newSourceVec_x, newSourceVec_y)
        source.move()
        source.collisionDone = true
    }

}


