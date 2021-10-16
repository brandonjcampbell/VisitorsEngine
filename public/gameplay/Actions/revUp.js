const candyInHand = (gameState) => {
    const candy = gameState.player.hand.find(x=>x.type==="item" && x.type.class ==="candy")
    return candy
}

const revUp = {
    "name":"Rev Up",
    "limit":[1,2,3,4,5,6,7],
    "effects":[{"using":"strength","target":"self","stat":"haste","amount":+1}],
    "conditions":[candyInHand]
}


export default revUp