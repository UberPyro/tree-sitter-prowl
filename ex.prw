def rules = #[
  3 "fizz", 
  5 "buzz", 
  7 "bizz", 
]

def fizzbuzz = 
  as~ n -> 
  rules <?> n rot div
  ~ !pop n to-str | fold

def main = 
  to-int fizzbuzz "\n" interleave
