using UnityEngine;

public class BulletMover : MonoBehaviour
{
    public Combatant owner;
    public Vector3 direction;
    public float speed;
    public float damage;
    public float life;

    private void Update()
    {
        float dt = Time.deltaTime;
        transform.position += direction * speed * dt;
        life -= dt;

        if (life <= 0f)
        {
            Destroy(gameObject);
            return;
        }

        Combatant hit = GameBootstrap.Instance.FindHit(transform.position, owner);
        if (hit != null)
        {
            bool wasAlive = hit.alive;
            hit.ApplyDamage(damage);
            if (wasAlive && !hit.alive)
            {
                owner.kills += 1;
            }
            Destroy(gameObject);
        }
    }
}
