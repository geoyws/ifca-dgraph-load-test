curl -H "Content-Type: application/graphql+-" localhost:8080/query -XPOST -d '
{
  getRoomCountForOneHotel(func: eq(dgraph.type, "Hotel")) @filter(eq(name, "Hotel1")) {
    roomCount: count(~hotel) @filter(eq(dgraph.type, "Room"))
  }
}' | python -m json.tool | less