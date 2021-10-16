import spectral from './../Types/spectral.js'
import angelic from './../Types/angelic.js'
import tenebrosity from './../Arts/tenebrosity.js'
import bone from './../Arts/bone.js'

const reappit = {
    "name":"Reappit",
    "baseStats":{
        "charisma":1,
        "wisdom":1,
        "strength":1,
        "haste":1,
        "SP":1,
        "WP":1,
        "CP":1
    },
    "types":[spectral,angelic],
    "cardPool":[
        tenebrosity,
        bone
    ]
}
export default reappit;