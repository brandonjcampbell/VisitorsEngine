import _ from 'lodash';
import prompt  from 'prompt'
import reappit  from "./Visitors/reappit.js";
import cobblin  from "./Visitors/cobblin.js";
import lillyKipper  from "./Visitors/lillyKipper.js";

import visitor from "./visitor.js"
import nicknames from "./nicknames.js"

const visitors = [reappit,cobblin,lillyKipper]

const repeat = (func, times) => {
    func();
    times && --times && repeat(func, times);
}

const onErr = (err) => {
    console.log(err);
    return 1;
}

const stampVisitor = (species) =>{
    let individual = _.cloneDeep(visitor)
    individual.species = species;
    individual.nickname = nicknames.names[Math.floor(Math.random()*nicknames.names.length)];
    individual.stats.CP = individual.species.baseStats.CP + Math.round(Math.random(2))
    individual.stats.WP = individual.species.baseStats.WP + Math.round(Math.random(2))
    individual.stats.SP = individual.species.baseStats.SP + Math.round(Math.random(2))
    individual.stats.charisma = individual.species.baseStats.charisma + Math.round(Math.random(2))
    individual.stats.wisdom = individual.species.baseStats.wisdom + Math.round(Math.random(2))
    individual.stats.strength = individual.species.baseStats.strength + Math.round(Math.random(2))
    individual.stats.haste = individual.species.baseStats.haste + Math.round(Math.random(2))
    individual.condition = _.cloneDeep(individual.stats);
    individual.deck = stampDeck(individual.species.cardPool)
    return individual
}

const stampDeck = (cardPool) => {
    let deck =[];
    for(let i =0; i < 20; i++){
        let pool =  cardPool[Math.floor(Math.random()*cardPool.length)];
        let card =  pool.cardPool[Math.floor(Math.random()*pool.cardPool.length)];
        deck.push(card)
    }
    return deck;
}

const visitorOne = stampVisitor(visitors[Math.floor(Math.random()*visitors.length)])
const visitorTwo = stampVisitor(visitors[Math.floor(Math.random()*visitors.length)])
const visitorThree = stampVisitor(visitors[Math.floor(Math.random()*visitors.length)])
const visitorFour = stampVisitor(visitors[Math.floor(Math.random()*visitors.length)])

const stampPlayer = (name,role) =>{
    return {
        name:name,
        role:role,
        active:{
            hand:[],
            state:{},
            deck:[],
            discard:[]
        },
        bench:[
            {
                hand:[],
                state:{},
                deck:[],
                discard:[]
            }
        ],
        graveyard:[]
    }
}

let gameState = {
    turns:[{
        order:[],
        playerOne:stampPlayer("One","playerOne"),
        playerTwo:stampPlayer("Two","playerTwo"),
        actions:[]
    }]  
}

const draw = (deck,hand)=>{
    const card = deck.pop();
    hand.push(card)
}

const determineOrder = (turn)=>{
    let participants = []
    if(turn.playerOne.active.state.condition.haste > turn.playerTwo.active.state.condition.haste){
        participants = [turn.playerOne.active,turn.playerTwo.active]
    }else if(turn.playerOne.active.state.condition.haste < turn.playerTwo.active.state.condition.haste){
        participants = [turn.playerTwo.active,turn.playerOne.active]
    }else{
        participants = [turn.playerTwo.active,turn.playerOne.active]
        participants = _.shuffle(participants)
    }
    return participants;
}

gameState.turns[0].playerOne.active.state = visitorOne;
gameState.turns[0].playerOne.active.deck = _.cloneDeep(visitorOne.deck)
repeat(()=>draw(gameState.turns[0].playerOne.active.deck,gameState.turns[0].playerOne.active.hand),3)
gameState.turns[0].playerOne.bench[0].state = visitorTwo;
gameState.turns[0].playerOne.bench[0].deck = _.cloneDeep(visitorTwo.deck);
gameState.turns[0].playerTwo.active.state = visitorThree;
gameState.turns[0].playerTwo.active.deck = _.cloneDeep(visitorThree.deck)
repeat(()=>draw(gameState.turns[0].playerTwo.active.deck,gameState.turns[0].playerTwo.active.hand),3)
gameState.turns[0].playerTwo.bench[0].state = visitorFour;
gameState.turns[0].playerTwo.bench[0].deck = _.cloneDeep(visitorFour.deck);
gameState.turns[0].order = determineOrder(gameState.turns[0])

const nextRound =(gameState)=>{
    let currentTurn = _.cloneDeep(gameState.turns[gameState.turns.length-1]);
    gameState.gameOver = engine.checkWinConditions(gameState);
    console.log("Game over?", gameState.gameOver)
    if(currentTurn.playerOne.active.state.condition.knockedOut){
        currentTurn.playerOne.graveyard.push(currentTurn.playerOne.active)
        engine.chooseNewActive(currentTurn.playerOne, currentTurn)
    }
    if(currentTurn.playerTwo.active.state.condition.knockedOut){
        currentTurn.playerTwo.graveyard.push(currentTurn.playerTwo.active)
        engine.chooseNewActive(currentTurn.playerTwo, currentTurn)
    }
    engine.draw(currentTurn.playerOne.active.deck,currentTurn.playerOne.active.hand)
    engine.draw(currentTurn.playerTwo.active.deck,currentTurn.playerTwo.active.hand)
    gameState.turns.push(currentTurn)
   return gameState;
}


const calcDamage = (card,effect, user,target,turn)=>{

    turn.actions.push(card.name + " hit " + target.state.species.name + target.state.nickname + " for " + effect.stat + effect.amount * user.state.condition[effect.using])
    target.state.condition[effect.stat] += effect.amount * user.state.condition[effect.using]
    if(target.state.condition[effect.stat] > target.state.stats[effect.stat]){ /// prevent the target's stats from rising above their maximum
        target.state.condition[effect.stat] = target.state.stats[effect.stat]
    }
    engine.checkKnockout(target,turn)
    if(target!==user){
        engine.checkKnockout(user,turn)
    }
}

const playCard = (turn, player, handIndex) => {
    const card = player.active.hand[handIndex]

    turn.actions.push(player.name + "'s " + player.active.state.species.name + " " + player.active.state.nickname + " used " + card.name)
    
    player.active.hand.splice(handIndex,1)
    player.active.discard.push(card)
   
    card.effects.forEach(x=>{
        let target;
        let user;
        if((x.target==="opponent" && player.role==="playerTwo")){
            user = turn.playerTwo.active
            target = turn.playerOne.active
        }else if((x.target==="self" && player.role==="playerTwo")){
            target = turn.playerTwo.active
            user = turn.playerTwo.active
        }else if((x.target==="self" && player.role==="playerOne")){
            target = turn.playerOne.active
            user = turn.playerOne.active
        }else if((x.target==="opponent" && player.role==="playerOne")){
            user = turn.playerOne.active
            target = turn.playerTwo.active
        }

        engine.calcDamage(card,x,user,target, turn)        
    })
}

const checkWinConditions = (gameState) => {
    const currentTurn = gameState.turns[gameState.turns.length-1]
    const drawCondition = currentTurn.playerTwo.bench.length === 0 && currentTurn.playerTwo.active.state.condition.knockedOut && currentTurn.playerOne.bench.length === 0 && currentTurn.playerOne.active.state.condition.knockedOut
    let winner = null;
    if(currentTurn.playerTwo.bench.length === 0 && currentTurn.playerTwo.active.state.condition.knockedOut && !drawCondition){
        winner = currentTurn.playerOne
    }
    if(currentTurn.playerOne.bench.length === 0 && currentTurn.playerOne.active.state.condition.knockedOut && !drawCondition){
        winner = currentTurn.playerTwo
    }
    
    if(winner){
        currentTurn.actions.push(winner.name + " WON")
        return true;
    }
    if(drawCondition){
        currentTurn.actions.push("DRAW")
        return true;
    }
    return false;
}

const statDepleted = (visitor,stat)=>{
    if (visitor.state.condition[stat]<= 0){
        return true
    }
    return false
}

const checkKnockout = (visitor,turn) =>{
    if (
    engine.statDepleted(visitor,"SP") ||
    engine.statDepleted(visitor,"WP") ||
    engine.statDepleted(visitor,"CP")){
        turn.actions.push(visitor.state.species.name + " " + visitor.state.nickname + " DEFEATED!")
        visitor.state.condition.knockedOut = true
    }

}

const chooseNewActive = (player, turn)=>{
        const next = player.bench.pop()
        if(next){
        player.active = next
       turn.actions.push(player.name + " promoted " + player.active.state.species.name + " " + player.active.state.nickname + " to the Active Position!")
        repeat(()=>engine.draw(player.active.deck,player.active.hand),3)
        }else{
            turn.actions.push(player.name + " is out of useable Visitors!")
        }     
}

const executeRound = (gameState,actionQueue)=>{
    const turn = gameState.turns[gameState.turns.length-1]
   turn.order = engine.determineOrder(turn)

    turn.order.forEach(x=>{
        let action
        let player
        
        if (turn.playerOne.active === x){
            player = turn.playerOne
         
        }else{
            player = turn.playerTwo
        }  

        action = actionQueue.find(x=>x.playerName === player.name).actionIndex

        if(!player.active.state.condition.knockedOut){
            turn.actions.push(player.name+"'s Turn ----------------")
            engine.playCard(turn,player,parseInt(action))
            
            
        }
        
    })

    turn.actions.forEach(x=> console.log(x))
    return gameState
}

const engine = {
    gameState,
    nextRound,
    playCard,
    chooseNewActive,
    checkKnockout,
    checkWinConditions,
    statDepleted,
    executeRound,
    calcDamage,
    draw,
    determineOrder
}

export default(engine)
//prompt.start();
//nextRound(gameState)