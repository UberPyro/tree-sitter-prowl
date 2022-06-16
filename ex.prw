mod

  def rules = #[
    3 "fizz", 
    5 "buzz", 
    7 "bizz", 
  ]

  def fizzbuzz = 
    (1 ..)
    as~ n -> 
    rules <?> n rot div
    ~ !pop n to-str | fold
  
  def main = 
    fizzbuzz "\n" interleave

end
