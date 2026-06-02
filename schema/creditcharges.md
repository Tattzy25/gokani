THE FOLLOWING ARE EXAMPLES DO NOT HARD CODE ANYTHING AND THEY MAY NOT BE THE CORRECT AMOUNTS USED IN THE DB SINCE IT IS JUST AN EXAMPLE 

amount default 4 
previous balance showing 100 
new balance showing 96

the user clicks the button they have set outputs to 3 images 
the database looks at source id confirms this source id exists looks at per click cost = 1 then 3x1=3

NOW 


AMOUNT = 3
PREVIOUS BALANCE = 96
NEW BALANCE = 93

NEXT TIME THE USER CLICKS AGAIN 
EXAMPLE 

the user clicks the button they have set outputs to 4 images 
the database looks at source id confirms this source id exists looks at per click cost = 1 then 4x1=4

NEVER UPDATE ITS ALWAYS NEW TRANSACTION EVENT

AMOUNT = 4
PREVIOUS BALANCE = 93
NEW BALANCE = 89


THE USER BUYS CREDITS FROM SHOPIFY STORE GID = EXAMPLE-370937837 750 CREDITS 

NOW 

ADDED AMOUNT = 750
PREVIOUS BALANCE = 89
NEW BALANCE = 839

EXAMPLE 

the user clicks the button they Want to train a model and have their own model = 100 credits 
the database looks at source id confirms this source id exists looks at per click cost = 100 then 100x1=100

AMOUNT = 100
PREVIOUS BALANCE = 839
NEW BALANCE = 739
