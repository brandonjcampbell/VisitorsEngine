const candyInHand = (gameState) => {
    const candy = gameState.player.hand.find(x=>x.type==="item" && x.type.class ==="candy")
    return candy
}
const lavaGlob = {
    "name":"Lava Glob",
    "limit":[1,2,3,4,5,6,7],
    "effects":[{"using":"strength","target":"opponent","stat":"SP","amount":-2},{"using":"strength","target":"self","stat":"SP","amount":-1}],
    "conditions":[candyInHand]
}
export default lavaGlob