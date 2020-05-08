curl -H "Content-Type: application/graphql+-" localhost:8080/query -XPOST -d '
{
  getAllHotels(func: eq(dgraph.type, "Hotel")) {
    expand(_all_)
  }
}' | python -m json.tool | less