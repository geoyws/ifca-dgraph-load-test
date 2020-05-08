curl -H "Content-Type: application/graphql+-" localhost:8080/query -XPOST -d '
{
  getRoomCountForAllHotels(func: eq(dgraph.type, "Hotel")) {
    roomCount: count(~hotel) @filter(eq(dgraph.type, "Room"))
  }
}' | python -m json.tool | less