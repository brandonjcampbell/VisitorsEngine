const candyInHand = (gameState) => {
    const candy = gameState.player.hand.find(x=>x.type==="item" && x.type.class ==="candy")
    return candy
}

const sparkBreath = {
    "name":"Spark Breath",
    "limit":[1,2,3,4,5,6,7],
    "effects":[{"target":"opponent", "stat":"SP","amount":-1, "using":"strength"}],
    "conditions":[candyInHand]
}


export default sparkBreath