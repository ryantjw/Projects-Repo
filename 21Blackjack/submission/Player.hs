-- | This is the file you need to implement to complete the assignment. Remember
-- to comment where appropriate, use generic types and have fun!
module Player where

import           Parser.Parser      -- This is the source for the parser from the course notes
import           Cards              -- Finally, the generic card type(s)

import           Parser.Instances
import           TwentyOne.Types    -- Here you will find types used in the game of TwentyOne
import           TwentyOne.Rules    -- Rules of the game


-- You can add more imports if you need them

data Memory = Memory
    {
        choice :: ChoiceAction,
        counter :: Int
    }
    deriving (Show)


fromMemory :: ParseResult a -> a
fromMemory (Result _ xs) = xs
fromMemory (Error _) = error "There is an error occured while parsing."

-- -- Parser for strings
string :: String -> Parser String
string = traverse is

-- Parser for spaces referenced from course notes
spaces :: Parser ()
spaces = (is ' ' >> spaces) ||| pure ()

fromMaybe :: Maybe a -> a -> a
fromMaybe (Just x) _ = x
fromMaybe Nothing y = y


memToString :: Memory -> String
memToString Memory {choice,counter} = show choice ++ " " ++ show counter

data ChoiceAction = Bidd | Hitt | Standd | Doubled|Splitt|Dhit

instance Show ChoiceAction where 
    show Bidd = "B"
    show Hitt = "H"
    show Standd = "S"
    show Doubled = "D"
    show Splitt = "P"
    show Dhit = "T"

instance Eq ChoiceAction where 
    (==) Bidd           Bidd            = True
    (==) Hitt           Hitt            = True
    (==) Standd         Standd          = True
    (==) Splitt         Splitt          = True
    (==) Doubled        Doubled         = True
    (==) Dhit           Dhit            = True
    (==) _              _               = False

bidd :: Parser ChoiceAction
bidd = is 'B' >> pure Bidd

hitt :: Parser ChoiceAction
hitt = is 'H' >> pure Hitt

standd :: Parser ChoiceAction
standd = is 'S' >> pure Standd

doubled :: Parser ChoiceAction
doubled = is 'D' >> pure Doubled

splitt :: Parser ChoiceAction
splitt = is 'P' >> pure Splitt

dhit :: Parser ChoiceAction
dhit = is 'T' >> pure Dhit

choiceaction :: Parser ChoiceAction
choiceaction = bidd|||hitt|||standd|||doubled|||splitt|||dhit

-- Digits taken and referenced from course notes
-- https://tgdwyer.github.io/parsercombinators/
oneDigit :: Parser Char
oneDigit = is '0' ||| is '1' ||| is '2' ||| is '3' ||| is '4' ||| is '5' ||| is '6' ||| is '7' ||| is '8' ||| is '9'

threeDigits :: Parser [Char]
threeDigits = do
    a <- oneDigit
    b <- oneDigit
    c <- oneDigit
    pure [a,b,c]

-- Parser for two digits
twoDigits :: Parser [Char]
twoDigits = do
    a <- oneDigit
    b <- oneDigit
    pure [a,b]

singleDigit :: Parser [Char]
singleDigit = do
    a <- oneDigit
    pure [a]

posDigit :: Parser [Char]
posDigit = threeDigits ||| twoDigits ||| singleDigit

dataMemory :: Parser Memory
dataMemory = do
    a <- choiceaction
    spaces
    b <- posDigit
    spaces
    return (Memory a (read b :: Int) )

initialData :: Parser Memory
initialData = string "INITIAL" >> return (Memory Bidd 0)

memoryToParse :: Parser Memory
memoryToParse = dataMemory ||| initialData

parseStr :: String -> Memory
parseStr m =  fromMemory $ parse memoryToParse m

-- | This function is called once it's your turn, and keeps getting called until your turn ends.
playCard :: PlayFunc
playCard Nothing _ _ _ m _ = (Bid minBid, strMemo)
        where 
            newCounter = counter$parseStr(fromMaybe m "INITIAL")
            currentAction = Bidd
            strMemo = memToString $ Memory{choice = currentAction,counter = newCounter}     
    
playCard (Just a) _ _ _ mem hand 
    | toDoubleStand mem = (Stand,strMemo)
    | toDoubleHit mem = (Hit,strMemo)
    | toDoubleDown a hand =(DoubleDown minBid,strMemo)
    | toSplit hand = (Split minBid,strMemo)
    | toHit a hand = (Hit,strMemo)
    | otherwise = (Stand, strMemo)
        where 
            oldCounter = counter $ parseStr(fromMaybe mem "INITIAL")
            newCounter = if checkUpcard a then oldCounter + 1 else oldCounter
            selectedChoice
                | toDoubleStand mem = Standd
                | toDoubleHit mem = Dhit
                | toDoubleDown a hand = Doubled
                | toSplit hand = Splitt
                | toHit a hand = Hitt
                | otherwise = Standd

            strMemo = memToString $ Memory{choice =selectedChoice, counter =newCounter}


toDoubleHit :: Maybe String -> Bool
toDoubleHit memo = decision
    where 
        prevAction = choice $ parseStr(fromMaybe memo "INITIAL")
        decision = prevAction == Doubled

toDoubleStand :: Maybe String -> Bool
toDoubleStand memo = decision
    where 
        prevAction = choice $ parseStr(fromMaybe memo "INITIAL")
        decision = prevAction == Dhit

checkUpcard :: Card -> Bool
checkUpcard upcard = decision
    where 
        uc = getRank upcard
        arr = [Ten,Jack,Queen,King,Ace]
        decision = uc `elem` arr

same :: Eq b => (t -> b) -> t -> [t] -> Bool
same func c xs = all (== func c) (map func xs)

sameRank :: [Card] -> Bool
sameRank [] = False
sameRank (x:xs) = same getRank x xs 

isSetPair :: [Card] -> Bool
isSetPair cs = length cs == 2 && sameRank cs

toSplit :: [Card] -> Bool
toSplit [] = False
toSplit (x:xs) =  (getRank x == Eight||getRank x == Ace) && isSetPair (x:xs)

hasCard :: [Card] -> Rank -> Bool
hasCard [] _ = False
hasCard (x:xs) inputCard 
    | getRank x == inputCard = True
    | otherwise = hasCard xs inputCard

checkSoftHand :: [Card] -> Bool
checkSoftHand cs = hasCard cs Ace && length cs == 2

toHit :: Card-> [Card] -> Bool
toHit upCard cs 
    | checkSoftHand cs = softDecision
    | not(checkSoftHand cs) = hardDecision
    | otherwise = False
    where
        rankUC = getRank upCard

        -- A Soft Hand
        softArrCase = [Two,Three,Four,Five,Six,Nine,Ten,Jack,Queen,King,Ace]
        softDecision = elem rankUC softArrCase && handCalc cs <= 18
                        
        -- Not a Soft Hand
        arrCase1 = [Two,Three]
        arrCase2 = [Four,Five,Six]
        arrCase3 = [Seven,Eight,Nine,Ten,Jack,Queen,King]
        toHitCase1 = elem rankUC arrCase1 && handCalc cs <= 12 
        toHitCase2 = elem rankUC arrCase2 && handCalc cs <=11
        toHitCase3 = elem rankUC arrCase3 && handCalc cs <= 16
        toHitCase4 = (rankUC == Ace) && handCalc cs <= 17

        hardDecision = toHitCase1||toHitCase2||toHitCase3||toHitCase4

toDoubleDown :: Card -> [Card] -> Bool
toDoubleDown upCard cs 
    | (length cs == 2) && checkSoftHand cs = softDecision
    | (length cs == 2) && not (checkSoftHand cs) = hardDecision
    | otherwise = False
    where
        rankUC = getRank upCard

        -- A soft hand
        softArrCase1 = [Five,Six]
        toDoubleSoft1 = elem rankUC softArrCase1 && handCalc cs <=18
        toDoubleSoft2 = (rankUC == Four) && (handCalc cs >= 15 && handCalc cs <=18)
        toDoubleSoft3 = (rankUC == Three) && (handCalc cs == 17|| handCalc cs == 18)

        softDecision = toDoubleSoft1||toDoubleSoft2||toDoubleSoft3

        -- A hard Hand
        arrC1 = [Two,Three,Four,Five,Six,Seven,Eight,Nine,Ten,Jack,Queen,King,Ace]
        arrC2 = [Four,Five,Six]
        arrC3 = [Five,Six]
        toDoubleCase1 = elem rankUC arrC1 && handCalc cs == 11
        toDoubleCase2 = elem rankUC arrC2 && handCalc cs == 10
        toDoubleCase3 = elem rankUC arrC3 && handCalc cs == 9

        hardDecision = toDoubleCase1||toDoubleCase2||toDoubleCase3

